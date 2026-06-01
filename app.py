import glob
import json
import asyncio
import uuid
import os
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from orchestrator import build_graph, NewsroomState
from mcp_client import MCPClientManager
import projects as proj_store

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── WebSocket connection manager ───────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# ── File-system watcher (watches all projects/ recursively) ───────────────────

class ArtifactHandler(FileSystemEventHandler):
    def __init__(self, loop):
        self.loop = loop

    def on_modified(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return

        filename = os.path.basename(event.src_path)

        # Extract project_id from path: projects/<project_id>/artifacts/<file>.md
        parts = event.src_path.replace('\\', '/').split('/')
        project_id = None
        try:
            idx = parts.index('projects')
            project_id = parts[idx + 1]
        except (ValueError, IndexError):
            pass

        try:
            with open(event.src_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({
                    "type": "file_update",
                    "filename": filename,
                    "content": content,
                    "project_id": project_id,
                }),
                self.loop
            )
        except Exception as e:
            print(f"[Watcher] Error reading {event.src_path}: {e}")


@app.on_event("startup")
async def startup_event():
    proj_store.init_db()
    loop = asyncio.get_running_loop()
    event_handler = ArtifactHandler(loop)
    observer = Observer()
    os.makedirs("projects", exist_ok=True)
    observer.schedule(event_handler, path="projects", recursive=True)
    observer.start()
    app.state.observer = observer
    print("[Startup] File watcher started on projects/ (recursive)")


@app.on_event("shutdown")
async def shutdown_event():
    app.state.observer.stop()
    app.state.observer.join()


# ── Project REST endpoints ────────────────────────────────────────────────────

@app.get("/projects")
async def list_all_projects():
    """Return all projects, newest first."""
    return proj_store.list_projects()


class CreateProjectPayload(BaseModel):
    prompt: str
    audience: str
    domain: str = "technical-docs"


@app.post("/projects")
async def create_new_project(payload: CreateProjectPayload):
    """Create a project record + isolated directory tree."""
    return proj_store.create_project(payload.prompt, payload.audience, payload.domain)


@app.get("/projects/{project_id}")
async def get_single_project(project_id: str):
    """Return project metadata + full NewsroomState snapshot."""
    project = proj_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/projects/{project_id}")
async def delete_single_project(project_id: str):
    """Delete project from DB and remove its directory."""
    proj_store.delete_project(project_id)
    return {"success": True}


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    graph = build_graph()
    state = None
    current_project_id = None

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # ── start_run ────────────────────────────────────────────────────
            if message.get("type") == "start_run":
                print("[WS] start_run received")

                project_id = message.get("project_id")
                if not project_id:
                    # Fallback: create a project on-the-fly (shouldn't happen with new UI)
                    p = proj_store.create_project(
                        prompt=message.get("prompt", ""),
                        audience=message.get("target_audience", ""),
                        domain=message.get("domain", "technical-docs"),
                    )
                    project_id = p["id"]

                current_project_id = project_id
                paths = proj_store.get_project_paths(project_id)

                run_id = str(uuid.uuid4())
                state = NewsroomState(
                    run_id=run_id,
                    project_path=paths["project_path"],
                    prompt=message.get("prompt", ""),
                    target_audience=message.get("target_audience", ""),
                    domain=message.get("domain", "technical-docs"),
                    rdf_db_path=paths["rdf_db_path"],
                    compliance_db_path=paths["compliance_db_path"],
                )

                await websocket.send_json({
                    "type": "status_update",
                    "run_id": run_id,
                    "phase": "intake",
                    "message": "Initiating newsroom state machine...",
                })

                result = await graph.ainvoke(state.dict())
                state = NewsroomState(**result)

                # Persist snapshot after brief + outline
                proj_store.save_project_state(project_id, state.dict(), state.run_phase)

                await websocket.send_json({
                    "type": "outline_proposal",
                    "brief": state.brief,
                    "outline": state.outline,
                    "phase": state.run_phase,
                })

            # ── approve_outline ──────────────────────────────────────────────
            elif message.get("type") == "approve_outline":
                print("[WS] approve_outline received")
                if state:
                    state.ws_signal = "outline_approved"
                    state.run_phase = "negotiation"

                    # Resolve commissioning-phase tickets
                    updated_memo = []
                    for t in state.editorial_memo:
                        if t.ticket_id in ["ticket-b4", "ticket-b1"]:
                            updated_memo.append(t.model_copy(update={"resolved": True}))
                        else:
                            updated_memo.append(t)
                    state.editorial_memo = updated_memo

                    await websocket.send_json({
                        "type": "status_update",
                        "phase": "drafting",
                        "message": "Outline approved. Starting deep drafting phase...",
                    })

                    result = await graph.ainvoke(state.dict())
                    state = NewsroomState(**result)
                    app.state.active_state = state

                    # Persist snapshot after full drafting pass
                    if current_project_id:
                        proj_store.save_project_state(
                            current_project_id, state.dict(), state.run_phase
                        )

                    await websocket.send_json({
                        "type": "run_complete",
                        "manuscript": state.manuscript,
                        "editorial_memo": [t.dict() for t in state.editorial_memo],
                        "phase": state.run_phase,
                    })

            # ── chat_message ─────────────────────────────────────────────────
            elif message.get("type") == "chat_message":
                user_msg = message.get("text", "")
                print(f"[WS] chat_message: {user_msg!r}")

                if state:
                    # Reload latest disk files so manual edits are preserved
                    if current_project_id:
                        artifacts_dir = proj_store.get_project_paths(current_project_id)["project_path"]
                    else:
                        artifacts_dir = "artifacts"

                    for fpath in glob.glob(f"{artifacts_dir}/*.md"):
                        sid = os.path.basename(fpath).replace(".md", "")
                        if "final_manuscript" not in sid:
                            try:
                                with open(fpath, "r", encoding="utf-8") as f:
                                    state.manuscript[sid] = f.read()
                            except Exception as e:
                                print(f"[WS] Error loading {fpath}: {e}")

                    # Resolve tickets based on keywords
                    resolved_any = False
                    updated_memo = []
                    for t in state.editorial_memo:
                        if (
                            t.ticket_id in ["ticket-b4", "ticket-b1"]
                            and not t.resolved
                            and any(w in user_msg.lower() for w in ["rate limit", "deprecated", "archive", "resolve"])
                        ):
                            updated_memo.append(t.model_copy(update={"resolved": True}))
                            resolved_any = True
                        elif (
                            t.ticket_id == "ticket-contradiction"
                            and not t.resolved
                            and any(w in user_msg.lower() for w in ["contradiction", "expires", "hours", "expiration", "resolve", "resume"])
                        ):
                            updated_memo.append(t.model_copy(update={"resolved": True}))
                            resolved_any = True
                        else:
                            updated_memo.append(t)
                    state.editorial_memo = updated_memo

                    if any(w in user_msg.lower() for w in ["resume", "check", "verify", "run", "compile"]):
                        resolved_any = True

                    reply = "Received your comments. Please review and click Approve when ready."
                    if resolved_any:
                        reply = "Understood. Blockers resolved. Resuming pipeline..."

                        state.ws_signal = "resume_drafting"
                        state.run_phase = "review_halt"

                        await websocket.send_json({
                            "type": "status_update",
                            "phase": "drafting",
                            "message": "Resuming drafting with resolved blockers...",
                        })

                        result = await graph.ainvoke(state.dict())
                        state = NewsroomState(**result)
                        app.state.active_state = state

                        # Persist updated snapshot
                        if current_project_id:
                            proj_store.save_project_state(
                                current_project_id, state.dict(), state.run_phase
                            )

                        await websocket.send_json({
                            "type": "run_complete",
                            "manuscript": state.manuscript,
                            "editorial_memo": [t.dict() for t in state.editorial_memo],
                            "phase": state.run_phase,
                        })
                        return

                    await websocket.send_json({
                        "type": "status_update",
                        "phase": state.run_phase,
                        "message": f"Co-Pilot: {reply}",
                    })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("[WS] Client disconnected.")
    except Exception as e:
        print(f"[WS] Error: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
        manager.disconnect(websocket)


# ── Export endpoint ───────────────────────────────────────────────────────────

class ExportPayload(BaseModel):
    format: str = "docx"
    project_id: str = None


@app.post("/export")
async def export_document(payload: ExportPayload):
    format_type = payload.format.lower()
    print(f"[Export] format={format_type} project={payload.project_id}")

    if payload.project_id:
        artifacts_dir = proj_store.get_project_paths(payload.project_id)["project_path"]
        final_md_path = os.path.abspath(
            os.path.join("projects", payload.project_id, "final_manuscript.md")
        )
    else:
        artifacts_dir = "artifacts"
        final_md_path = os.path.abspath("artifacts/final_manuscript.md")

    files = sorted(glob.glob(f"{artifacts_dir}/*.md"))
    files = [f for f in files if "final_manuscript" not in f]

    merged_content = ""
    for fpath in files:
        with open(fpath, "r", encoding="utf-8") as f:
            merged_content += f.read() + "\n\n"

    if not merged_content:
        return {"success": False, "error": "No draft markdown files found to export."}

    with open(final_md_path, "w", encoding="utf-8") as f:
        f.write(merged_content)
    print(f"[Export] Merged manuscript written to: {final_md_path}")

    mcp_manager = MCPClientManager()
    server_script = "mcp/artifact-server/src/server.js"
    try:
        await mcp_manager.connect_server("artifact-server", server_script)

        create_res = await mcp_manager.call_tool("artifact-server", "create_markdown", {
            "path": final_md_path,
            "content": merged_content,
            "metadata": {
                "title": "Scriptorium Document",
                "author": "Scriptorium Orchestrator",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
            }
        })

        print(f"[Export] create_markdown response: {create_res}")

        artifact_id = None
        if hasattr(create_res, "content") and create_res.content:
            res_data = json.loads(create_res.content[0].text)
            artifact_id = res_data.get("artifact_id")
        elif isinstance(create_res, dict):
            artifact_id = create_res.get("artifact_id")

        if not artifact_id:
            import re
            m = re.search(r'"artifact_id"\s*:\s*"([^"]+)"', str(create_res))
            if m:
                artifact_id = m.group(1)

        if not artifact_id:
            raise ValueError(f"Failed to get artifact_id from response: {create_res}")

        export_tool = "export_markdown_to_pdf" if format_type == "pdf" else "export_markdown_to_docx"
        export_res = await mcp_manager.call_tool("artifact-server", export_tool, {
            "artifact_id": artifact_id
        })

        output_path = None
        if hasattr(export_res, "content") and export_res.content:
            res_data = json.loads(export_res.content[0].text)
            output_path = res_data.get("path")
        elif isinstance(export_res, dict):
            output_path = export_res.get("path")

        return {
            "success": True,
            "format": format_type,
            "merged_manuscript": final_md_path,
            "exported_file": output_path,
        }
    except Exception as e:
        print(f"[Export] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
    finally:
        await mcp_manager.disconnect_all()
