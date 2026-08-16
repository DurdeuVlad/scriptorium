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

from orchestrator import build_graph, NewsroomState, ConversationMessage, reconcile_run_phase
from mcp_client import MCPClientManager
from consult_agent import consult_turn, start_consult_session, conversation_to_wire, ConsultResult
import projects as proj_store
from agency_settings import default_agency_settings, validate_outline_against_settings
from style_packs import (
    list_all_voices,
    save_custom_voice,
    delete_custom_voice,
    default_style_pack_for_domain,
)
from intent_router import route_user_intent, _heuristic_action_proposal
from action_executor import confirm_proposal, cancel_proposal, ApplyResult
from orchestrator import ProposedAction

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
    print("[Startup] Building LangGraph pipeline…")
    app.state.graph = build_graph()
    print("[Startup] LangGraph pipeline ready")
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
    name: str | None = None


@app.post("/projects")
async def create_new_project(payload: CreateProjectPayload):
    """Create a project record + isolated directory tree."""
    return proj_store.create_project(
        payload.prompt, payload.audience, payload.domain, name=payload.name
    )


class PlanUpdatePayload(BaseModel):
    brief: dict | None = None
    outline: dict | None = None
    agency_settings: dict | None = None
    active_style_pack: str | None = None


@app.get("/style-packs")
async def get_style_packs(project_id: str | None = None):
    """List built-in and optional per-project custom writing voices."""
    if project_id and not proj_store.get_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"voices": list_all_voices(project_id)}


class CustomVoicePayload(BaseModel):
    id: str | None = None
    name: str
    description: str = ""
    traits: str = ""


@app.get("/projects/{project_id}/voices")
async def list_project_voices(project_id: str):
    project = proj_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"voices": list_all_voices(project_id)}


@app.post("/projects/{project_id}/voices")
async def create_project_voice(project_id: str, payload: CustomVoicePayload):
    project = proj_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    voice = save_custom_voice(project_id, payload.dict())
    return {"success": True, "voice": voice}


@app.delete("/projects/{project_id}/voices/{voice_id}")
async def remove_project_voice(project_id: str, voice_id: str):
    project = proj_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    delete_custom_voice(project_id, voice_id)
    return {"success": True}


@app.patch("/projects/{project_id}/plan")
async def patch_project_plan(project_id: str, payload: PlanUpdatePayload):
    """Update brief/outline/agency settings in project state during negotiation."""
    try:
        result = proj_store.update_project_plan(
            project_id, payload.brief, payload.outline, payload.agency_settings
        )
        if payload.active_style_pack:
            project = proj_store.get_project(project_id)
            state = project.get("state") or {}
            state["active_style_pack"] = payload.active_style_pack
            brief = state.get("brief") or {}
            brief["style_pack"] = payload.active_style_pack
            state["brief"] = brief
            proj_store.save_project_state(project_id, state, project.get("phase") or "idle")
            result["active_style_pack"] = payload.active_style_pack
        return {"success": True, **result}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@app.get("/projects/{project_id}")
async def get_single_project(project_id: str):
    """Return project metadata + full NewsroomState snapshot."""
    project = proj_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    state = _apply_phase_reconciliation(project_id)
    if state:
        project["phase"] = state.run_phase
        snap = project.get("state") or {}
        snap["run_phase"] = state.run_phase
        project["state"] = snap
    return project


@app.get("/projects/{project_id}/conversation")
async def get_project_conversation(project_id: str):
    """Return persisted consult thread for a project."""
    project = proj_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    snap = project.get("state") or {}
    return {
        "conversation": snap.get("conversation", []),
        "intake_status": snap.get("intake_status", "not_started"),
        "pending_prompt": snap.get("pending_prompt"),
        "phase": project.get("phase"),
    }


@app.delete("/projects/{project_id}")
async def delete_single_project(project_id: str):
    """Delete project from DB and remove its directory."""
    proj_store.delete_project(project_id)
    return {"success": True}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# ── Artifact endpoints ────────────────────────────────────────────────────────

@app.get("/projects/{project_id}/artifacts")
async def list_project_artifacts(project_id: str):
    try:
        return proj_store.list_artifacts(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")


@app.get("/projects/{project_id}/artifacts/{artifact_id}")
async def get_project_artifact(project_id: str, artifact_id: str):
    try:
        content = proj_store.read_artifact(project_id, artifact_id)
        return {"id": artifact_id, "content": content}
    except FileNotFoundError as e:
        if "Project not found" in str(e):
            raise HTTPException(status_code=404, detail="Project not found")
        raise HTTPException(status_code=404, detail="Artifact not found")


class ArtifactBody(BaseModel):
    content: str


@app.put("/projects/{project_id}/artifacts/{artifact_id}")
async def put_project_artifact(project_id: str, artifact_id: str, body: ArtifactBody):
    try:
        meta = proj_store.write_artifact(project_id, artifact_id, body.content)
        return {"success": True, **meta}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")


# ── WebSocket helpers ─────────────────────────────────────────────────────────

def _normalize_run_phase(phase: str | None) -> str:
    if phase == "publishing":
        return "finished"
    return phase or "idle"


def _apply_phase_reconciliation(project_id: str) -> NewsroomState | None:
    """Reconcile run_phase with ticket state; persist when changed."""
    project = proj_store.get_project(project_id)
    if not project:
        return None
    stored_phase = project.get("phase") or "idle"
    state = _hydrate_state_from_project(project_id)
    if not state:
        return None
    if state.run_phase != stored_phase:
        _persist_state(project_id, state)
    return state


def _hydrate_state_from_project(project_id: str) -> NewsroomState | None:
    project = proj_store.get_project(project_id)
    if not project:
        return None
    paths = proj_store.get_project_paths(project_id)
    snap = project.get("state") or {}
    run_id = snap.get("run_id") or str(uuid.uuid4())
    conversation = []
    for m in snap.get("conversation", []):
        try:
            conversation.append(ConversationMessage(**m) if isinstance(m, dict) else m)
        except Exception:
            pass
    from orchestrator import PendingPrompt, EditTicket, ProposedAction

    pending = snap.get("pending_prompt")
    try:
        pending_obj = PendingPrompt(**pending) if pending else None
    except Exception:
        pending_obj = None

    pending_prop = snap.get("pending_proposal")
    try:
        pending_proposal_obj = ProposedAction(**pending_prop) if pending_prop else None
    except Exception:
        pending_proposal_obj = None

    memo = []
    for t in snap.get("editorial_memo", []):
        try:
            memo.append(EditTicket(**t) if isinstance(t, dict) else t)
        except Exception:
            pass

    state = NewsroomState(
        run_id=run_id,
        project_path=paths["project_path"],
        prompt=project.get("prompt", ""),
        target_audience=project.get("audience", ""),
        domain=project.get("domain", "technical-docs"),
        rdf_db_path=paths["rdf_db_path"],
        compliance_db_path=paths["compliance_db_path"],
        brief=snap.get("brief") or {},
        outline=snap.get("outline") or {},
        manuscript=snap.get("manuscript") or {},
        agency_settings=snap.get("agency_settings") or default_agency_settings(
            project.get("domain", "technical-docs")
        ),
        editorial_memo=memo,
        active_style_pack=snap.get("active_style_pack")
        or (snap.get("brief") or {}).get("style_pack")
        or default_style_pack_for_domain(project.get("domain", "technical-docs")),
        run_phase=project.get("phase") or snap.get("run_phase") or "idle",
        conversation=conversation,
        intake_status=snap.get("intake_status", "not_started"),
        pending_prompt=pending_obj,
        consult_mode=snap.get("consult_mode", "intake"),
        active_ticket_id=snap.get("active_ticket_id"),
        ws_signal=snap.get("ws_signal"),
        pending_proposal=pending_proposal_obj,
    )
    state.run_phase = reconcile_run_phase(state)
    return state


def _persist_state(project_id: str, state: NewsroomState):
    proj_store.save_project_state(project_id, state.dict(), state.run_phase)


def _conversation_sync_payload(project_id: str, state: NewsroomState) -> dict:
    phase = _normalize_run_phase(state.run_phase)
    return {
        "type": "conversation_sync",
        "project_id": project_id,
        "conversation": conversation_to_wire(state),
        "phase": phase,
        "intake_status": state.intake_status,
        "pending_prompt": state.pending_prompt.dict() if state.pending_prompt else None,
        "brief": state.brief,
        "outline": state.outline,
        "agency_settings": state.agency_settings,
        "active_style_pack": state.active_style_pack,
        "editorial_memo": [t.dict() for t in state.editorial_memo],
        "pending_proposal": state.pending_proposal.dict() if state.pending_proposal else None,
    }


def _append_system_message(state: NewsroomState, content: str) -> None:
    state.conversation = list(state.conversation) + [
        ConversationMessage(
            role="system",
            content=content,
            ts=datetime.utcnow().isoformat() + "Z",
        )
    ]


async def _emit_consult_result(
    websocket: WebSocket,
    state: NewsroomState,
    result: ConsultResult,
    project_id: str | None = None,
):
    if result.assistant_message:
        await websocket.send_json({
            "type": "assistant_message",
            "text": result.assistant_message,
            "phase": state.run_phase,
        })
    if result.plan_patch:
        await websocket.send_json({
            "type": "plan_patch",
            "brief": (result.plan_patch.get("brief") if result.plan_patch else None) or state.brief,
            "outline": (result.plan_patch.get("outline") if result.plan_patch else None) or state.outline,
            "agency_settings": state.agency_settings,
            "active_style_pack": state.active_style_pack,
            "phase": state.run_phase,
        })
    question_payload = result.assistant_question or result.pending_prompt
    if question_payload:
        await websocket.send_json({
            "type": "assistant_question",
            **question_payload,
            "phase": state.run_phase,
        })
    if result.intake_status:
        await websocket.send_json({
            "type": "intake_status",
            "status": result.intake_status,
            "phase": state.run_phase,
        })
    if result.editorial_memo is not None and project_id:
        await websocket.send_json({
            "type": "editorial_memo_sync",
            "project_id": project_id,
            "editorial_memo": [t.dict() for t in result.editorial_memo],
            "phase": _normalize_run_phase(state.run_phase),
        })


def _resolve_ws_project_state(
    message: dict,
    current_project_id: str | None,
    state: NewsroomState | None,
) -> tuple[str | None, NewsroomState | None]:
    """Always consult against disk-backed state for the intended project."""
    pid = message.get("project_id") or current_project_id
    if not pid:
        return current_project_id, state
    hydrated = _hydrate_state_from_project(pid)
    if hydrated:
        return pid, hydrated
    # pid doesn't hydrate to a real project (e.g. a client-supplied
    # project_id that doesn't exist). Don't trust it as the new
    # current_project_id -- that would poison the session's tracked
    # project to an unvalidated value while still carrying the old
    # (real) state, causing subsequent _persist_state() calls to
    # silently no-op against a non-existent row. Fall back to whatever
    # was already validated for this connection instead.
    return current_project_id, state


async def _run_pipeline_start(websocket: WebSocket, graph, state: NewsroomState, project_id: str):
    await websocket.send_json({
        "type": "status_update",
        "phase": "planning",
        "message": "Building brief and outline…",
    })
    _append_system_message(state, "Building your brief and outline…")
    state.run_phase = "planning"
    result = await graph.ainvoke(state.dict())
    state = NewsroomState(**result)
    section_count = len((state.outline or {}).get("sections") or [])
    _append_system_message(
        state,
        f"Outline ready — {section_count} chapter(s). Review the plan, then approve when you're happy.",
    )
    _persist_state(project_id, state)
    await websocket.send_json({
        "type": "outline_proposal",
        "brief": state.brief,
        "outline": state.outline,
        "agency_settings": state.agency_settings,
        "phase": state.run_phase,
    })
    await websocket.send_json(_conversation_sync_payload(project_id, state))
    return state


async def _run_pipeline_resume(websocket: WebSocket, graph, state: NewsroomState, project_id: str):
    await websocket.send_json({
        "type": "status_update",
        "phase": "drafting",
        "message": "Resuming pipeline with resolved blockers…",
    })
    _append_system_message(state, "Resuming drafting with your answers applied…")
    result = await graph.ainvoke(state.dict())
    state = NewsroomState(**result)
    _persist_state(project_id, state)
    phase = state.run_phase
    if phase == "publishing":
        state.run_phase = "finished"
        phase = "finished"
    draft_count = len([k for k in state.manuscript if k != "final_manuscript"])
    _append_system_message(
        state,
        f"Pipeline pass complete — {draft_count} section(s) drafted."
        if phase != "review_halt"
        else "Review halt — open tickets need your input in chat.",
    )
    _persist_state(project_id, state)
    await websocket.send_json({
        "type": "run_complete",
        "manuscript": state.manuscript,
        "editorial_memo": [t.dict() for t in state.editorial_memo],
        "phase": phase,
    })
    await websocket.send_json(_conversation_sync_payload(project_id, state))
    return state


async def _emit_proposed_action(
    websocket: WebSocket,
    state: NewsroomState,
    project_id: str,
    proposal: ProposedAction,
    assistant_message: str | None = None,
):
    state.pending_proposal = proposal
    msg = assistant_message or "Review this proposed change and confirm when ready."
    state.conversation = list(state.conversation) + [
        ConversationMessage(
            role="assistant",
            content=msg,
            ts=datetime.utcnow().isoformat() + "Z",
            meta={"proposal_id": proposal.proposal_id},
        )
    ]
    await websocket.send_json({
        "type": "proposed_action",
        "project_id": project_id,
        "proposal": proposal.dict(),
        "assistant_message": msg,
        "phase": state.run_phase,
    })
    _persist_state(project_id, state)
    await websocket.send_json(_conversation_sync_payload(project_id, state))


def _merge_plan_patch(state: NewsroomState, plan_patch: dict | None):
    if not plan_patch:
        return
    snap = state.dict()
    proj_store.merge_plan_in_state(
        snap,
        plan_patch.get("brief"),
        plan_patch.get("outline"),
        plan_patch.get("agency_settings"),
    )
    state.brief = snap.get("brief") or state.brief
    state.outline = snap.get("outline") or state.outline
    state.agency_settings = snap.get("agency_settings") or state.agency_settings
    if plan_patch.get("active_style_pack"):
        state.active_style_pack = plan_patch["active_style_pack"]
        brief = dict(state.brief or {})
        brief["style_pack"] = state.active_style_pack
        state.brief = brief


async def _apply_confirmed_action(
    websocket: WebSocket,
    graph,
    state: NewsroomState,
    project_id: str,
    apply_result: ApplyResult,
):
    """Run side effects after a proposal is confirmed."""
    if apply_result.plan_patch:
        _merge_plan_patch(state, apply_result.plan_patch)
        await websocket.send_json({
            "type": "plan_patch",
            "brief": state.brief,
            "outline": state.outline,
            "agency_settings": state.agency_settings,
            "active_style_pack": state.active_style_pack,
            "phase": state.run_phase,
        })
    if apply_result.intake_status:
        state.intake_status = apply_result.intake_status
    if apply_result.run_phase:
        state.run_phase = apply_result.run_phase
    if apply_result.ws_signal:
        state.ws_signal = apply_result.ws_signal

    _append_system_message(state, apply_result.message)

    if apply_result.pipeline_action == "generate_plan":
        _persist_state(project_id, state)
        return await _run_pipeline_start(websocket, graph, state, project_id)

    if apply_result.pipeline_action == "approve_outline":
        state.ws_signal = "outline_approved"
        state.run_phase = "negotiation"
        _persist_state(project_id, state)
        await websocket.send_json({
            "type": "status_update",
            "phase": "drafting",
            "message": "Outline confirmed. Starting drafting…",
        })
        result = await graph.ainvoke(state.dict())
        state = NewsroomState(**result)
        _persist_state(project_id, state)
        phase = state.run_phase
        if phase == "publishing":
            state.run_phase = "finished"
            phase = "finished"
        draft_count = len([k for k in state.manuscript if k != "final_manuscript"])
        _append_system_message(
            state,
            f"Drafting complete — {draft_count} section(s) ready.",
        )
        _persist_state(project_id, state)
        await websocket.send_json({
            "type": "run_complete",
            "manuscript": state.manuscript,
            "editorial_memo": [t.dict() for t in state.editorial_memo],
            "phase": phase,
        })
        await websocket.send_json(_conversation_sync_payload(project_id, state))
        return state

    if apply_result.pipeline_action == "export":
        fmt = apply_result.export_format or "docx"
        await websocket.send_json({
            "type": "export_requested",
            "format": fmt,
            "project_id": project_id,
        })
        return state

    _persist_state(project_id, state)
    await websocket.send_json(_conversation_sync_payload(project_id, state))
    return state


async def _handle_consult(
    websocket: WebSocket,
    graph,
    state: NewsroomState,
    project_id: str,
    user_text: str,
    action: str,
    proposal_id: str | None = None,
):
    # ── Proposal confirm / cancel ─────────────────────────────────────
    if action == "confirm_proposal":
        pid = proposal_id or user_text
        apply_result, msg = confirm_proposal(state, pid, project_id)
        if apply_result is None:
            await websocket.send_json({"type": "error", "message": msg})
            return state
        if not apply_result.success:
            await websocket.send_json({"type": "error", "message": apply_result.message})
            return state
        await websocket.send_json({
            "type": "proposal_resolved",
            "proposal_id": pid,
            "status": "confirmed",
        })
        return await _apply_confirmed_action(websocket, graph, state, project_id, apply_result)

    if action == "cancel_proposal":
        pid = proposal_id or user_text
        if state.pending_proposal and state.pending_proposal.proposal_id == pid:
            cancel_proposal(state)
            _append_system_message(state, "Change cancelled.")
            _persist_state(project_id, state)
            await websocket.send_json({
                "type": "proposal_resolved",
                "proposal_id": pid,
                "status": "cancelled",
            })
            await websocket.send_json(_conversation_sync_payload(project_id, state))
        else:
            await websocket.send_json({"type": "error", "message": "Proposal not found or already handled."})
        return state

    if action == "edit_proposal":
        await websocket.send_json({
            "type": "open_plan_editor",
            "project_id": project_id,
        })
        return state

    # ── Legacy direct actions → proposals ───────────────────────────
    if action == "generate_plan":
        proposal = _heuristic_action_proposal(state, "draft outline", project_id)
        if proposal:
            await _emit_proposed_action(
                websocket, state, project_id, proposal,
                "Confirm to start brief and outline generation.",
            )
        return state

    if action == "skip_question" or action == "resolve_ticket":
        result = await consult_turn(state, user_text=user_text, action=action, project_id=project_id)
        _persist_state(project_id, state)
        await _emit_consult_result(websocket, state, result, project_id=project_id)
        if result.resume_pipeline and state.ws_signal == "resume_drafting":
            state.run_phase = "review_halt"
            return await _run_pipeline_resume(websocket, graph, state, project_id)
        return state

    # ── Route user message through intent router ────────────────────
    if user_text and not action:
        route = await route_user_intent(state, user_text, project_id)

        if route.intent == "app_help" or route.intent == "conversation":
            msg = route.assistant_message or "How can I help?"
            state.conversation = list(state.conversation) + [
                ConversationMessage(
                    role="user", content=user_text,
                    ts=datetime.utcnow().isoformat() + "Z",
                ),
                ConversationMessage(
                    role="assistant", content=msg,
                    ts=datetime.utcnow().isoformat() + "Z",
                ),
            ]
            _persist_state(project_id, state)
            await websocket.send_json(_conversation_sync_payload(project_id, state))
            return state

        if route.intent == "action" and route.proposed_action:
            if user_text:
                state.conversation = list(state.conversation) + [
                    ConversationMessage(
                        role="user", content=user_text,
                        ts=datetime.utcnow().isoformat() + "Z",
                    ),
                ]
            await _emit_proposed_action(
                websocket, state, project_id,
                route.proposed_action,
                route.assistant_message,
            )
            return state

        if route.delegate == "consult" or route.intent == "consult":
            result = await consult_turn(state, user_text=user_text, action="", project_id=project_id)
            _merge_plan_patch(state, result.plan_patch)
            if result.plan_patch and result.plan_patch.get("active_style_pack"):
                state.active_style_pack = result.plan_patch["active_style_pack"]
            if result.editorial_memo is not None:
                state.editorial_memo = result.editorial_memo
            if result.intake_status:
                state.intake_status = result.intake_status
            if result.run_phase:
                state.run_phase = result.run_phase
            if result.ws_signal:
                state.ws_signal = result.ws_signal
            _persist_state(project_id, state)
            await _emit_consult_result(websocket, state, result, project_id=project_id)
            if result.resume_pipeline and state.ws_signal == "resume_drafting":
                state.run_phase = "review_halt"
                return await _run_pipeline_resume(websocket, graph, state, project_id)
            return state

    # ── Fallback consult (choices, etc.) ─────────────────────────────
    result = await consult_turn(state, user_text=user_text, action=action, project_id=project_id)
    _merge_plan_patch(state, result.plan_patch)
    if result.plan_patch and result.plan_patch.get("active_style_pack"):
        state.active_style_pack = result.plan_patch["active_style_pack"]
        brief = dict(state.brief or {})
        brief["style_pack"] = state.active_style_pack
        state.brief = brief
    if result.editorial_memo is not None:
        state.editorial_memo = result.editorial_memo
    if result.intake_status:
        state.intake_status = result.intake_status
    if result.run_phase:
        state.run_phase = result.run_phase
    if result.ws_signal:
        state.ws_signal = result.ws_signal

    _persist_state(project_id, state)
    await _emit_consult_result(websocket, state, result, project_id=project_id)

    if result.resume_pipeline and state.ws_signal == "resume_drafting":
        state.run_phase = "review_halt"
        return await _run_pipeline_resume(websocket, graph, state, project_id)
    return state


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    graph = getattr(app.state, "graph", None) or build_graph()
    state = None
    current_project_id = None

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # ── bind_project ─────────────────────────────────────────────────
            if message.get("type") == "bind_project":
                project_id = message.get("project_id")
                if not project_id:
                    continue
                hydrated = _hydrate_state_from_project(project_id)
                if hydrated:
                    current_project_id = project_id
                    state = hydrated
                    await websocket.send_json(_conversation_sync_payload(project_id, hydrated))
                continue

            # ── start_consult ────────────────────────────────────────────────
            if message.get("type") == "start_consult":
                print("[WS] start_consult received")
                project_id = message.get("project_id")
                if not project_id:
                    continue
                # Resolve into a local var first -- don't touch the
                # session's current_project_id/state until we know
                # project_id is real, so an invalid id can't clobber
                # whatever was already validated for this connection.
                hydrated = _hydrate_state_from_project(project_id)
                if not hydrated:
                    p = proj_store.get_project(project_id)
                    if not p:
                        await websocket.send_json({"type": "error", "message": "Project not found"})
                        continue
                    paths = proj_store.get_project_paths(project_id)
                    hydrated = NewsroomState(
                        run_id=str(uuid.uuid4()),
                        project_path=paths["project_path"],
                        prompt=message.get("prompt") or p.get("prompt", ""),
                        target_audience=message.get("target_audience") or p.get("audience", ""),
                        domain=message.get("domain") or p.get("domain", "technical-docs"),
                        rdf_db_path=paths["rdf_db_path"],
                        compliance_db_path=paths["compliance_db_path"],
                        run_phase="intake",
                        intake_status="not_started",
                        agency_settings=default_agency_settings(
                            message.get("domain") or p.get("domain", "technical-docs")
                        ),
                        active_style_pack=default_style_pack_for_domain(
                            message.get("domain") or p.get("domain", "technical-docs")
                        ),
                    )
                else:
                    if message.get("prompt"):
                        hydrated.prompt = message.get("prompt")
                    if message.get("target_audience"):
                        hydrated.target_audience = message.get("target_audience")
                    if message.get("domain"):
                        hydrated.domain = message.get("domain")

                current_project_id = project_id
                state = hydrated

                await websocket.send_json({
                    "type": "status_update",
                    "phase": "intake",
                    "message": "Consultation started.",
                })
                open_result = await start_consult_session(state, project_id)
                _persist_state(project_id, state)
                await _emit_consult_result(websocket, state, open_result, project_id=project_id)
                await websocket.send_json(_conversation_sync_payload(project_id, state))
                continue

            # ── consult_message / consult_action ───────────────────────────
            if message.get("type") in ("consult_message", "consult_action", "chat_message"):
                current_project_id, state = _resolve_ws_project_state(
                    message, current_project_id, state
                )
                if not state or not current_project_id:
                    await websocket.send_json({
                        "type": "assistant_message",
                        "text": "Select or create a project first.",
                        "phase": "idle",
                    })
                    continue

                user_text = message.get("text", "")
                action = message.get("action", "")
                if message.get("type") == "consult_action":
                    action = message.get("action_id") or message.get("action") or action
                    if message.get("choice"):
                        user_text = message.get("choice")

                if message.get("ticket_id"):
                    state.active_ticket_id = message.get("ticket_id")

                state = await _handle_consult(
                    websocket, graph, state, current_project_id, user_text, action,
                    proposal_id=message.get("proposal_id"),
                )
                continue

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
                elif not proj_store.get_project(project_id):
                    await websocket.send_json({"type": "error", "message": "Project not found"})
                    continue

                current_project_id = project_id
                hydrated = _hydrate_state_from_project(project_id)
                paths = proj_store.get_project_paths(project_id)

                if hydrated:
                    state = hydrated
                    if message.get("prompt"):
                        state.prompt = message.get("prompt")
                    if message.get("target_audience"):
                        state.target_audience = message.get("target_audience")
                    if message.get("domain"):
                        state.domain = message.get("domain")
                else:
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

                state.intake_status = "complete"
                state = await _run_pipeline_start(websocket, graph, state, project_id)

            # ── approve_outline ──────────────────────────────────────────────
            elif message.get("type") == "approve_outline":
                print("[WS] approve_outline received")
                if not state and current_project_id:
                    state = _hydrate_state_from_project(current_project_id)
                if state and current_project_id:
                    proposal = _heuristic_action_proposal(state, "approve outline", current_project_id)
                    if proposal:
                        await _emit_proposed_action(
                            websocket, state, current_project_id, proposal,
                            "Confirm to start drafting from the approved outline.",
                        )

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

def _export_fallback_local(
    project_id: str | None,
    merged_content: str,
    format_type: str,
    merged_path: str,
    reason: str = "",
) -> dict:
    """When artifact MCP is unavailable, save merged markdown for download."""
    print(f"[Export] Fallback local save ({reason})")
    if project_id:
        exp_dir = os.path.join("projects", project_id, "exports")
    else:
        exp_dir = os.path.join("artifacts", "exports")
    os.makedirs(exp_dir, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    out_path = os.path.abspath(os.path.join(exp_dir, f"manuscript_{ts}.md"))
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(merged_content)
    hint = (
        "Saved markdown locally. Start the artifact-server MCP for full "
        f"{format_type.upper()} conversion."
    )
    return {
        "success": True,
        "format": format_type,
        "merged_manuscript": merged_path,
        "exported_file": out_path,
        "fallback": True,
        "message": hint,
    }


class ExportPayload(BaseModel):
    format: str = "docx"
    project_id: str = None


@app.post("/export")
async def export_document(payload: ExportPayload):
    format_type = payload.format.lower()
    print(f"[Export] format={format_type} project={payload.project_id}")

    if payload.project_id:
        if not proj_store.get_project(payload.project_id):
            raise HTTPException(status_code=404, detail="Project not found")
        artifacts_dir = proj_store.get_project_paths(payload.project_id)["project_path"]
        final_md_path = os.path.abspath(
            os.path.join("projects", payload.project_id, "final_manuscript.md")
        )
    else:
        artifacts_dir = "artifacts"
        final_md_path = os.path.abspath("artifacts/final_manuscript.md")

    files = sorted(glob.glob(f"{artifacts_dir}/*.md"))
    files = [f for f in files if "final_manuscript" not in f]

    def sort_key(path: str) -> tuple:
        name = os.path.basename(path).replace(".md", "")
        return tuple(name.split("__"))

    files.sort(key=sort_key)

    top_level = [f for f in files if "__" not in os.path.basename(f)]
    ordered = []
    for tf in top_level:
        ordered.append(tf)
        base = os.path.basename(tf).replace(".md", "")
        for f in files:
            bn = os.path.basename(f).replace(".md", "")
            if bn.startswith(f"{base}__") and f not in ordered:
                ordered.append(f)
    for f in files:
        if f not in ordered:
            ordered.append(f)

    merged_content = ""
    for fpath in ordered:
        with open(fpath, "r", encoding="utf-8") as f:
            merged_content += f.read() + "\n\n"

    if not merged_content:
        return {"success": False, "error": "No draft markdown files found to export."}

    with open(final_md_path, "w", encoding="utf-8") as f:
        f.write(merged_content)
    print(f"[Export] Merged manuscript written to: {final_md_path}")

    mcp_manager = MCPClientManager()
    server_script = "mcp/artifact-server/src/server.js"
    if not os.path.exists(os.path.abspath(server_script)):
        return _export_fallback_local(
            payload.project_id,
            merged_content,
            format_type,
            final_md_path,
            "artifact-server script missing",
        )
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
            return _export_fallback_local(
                payload.project_id,
                merged_content,
                format_type,
                final_md_path,
                "no artifact_id from MCP",
            )

        export_tool = "export_markdown_to_pdf" if format_type == "pdf" else "export_markdown_to_docx"
        export_res = await mcp_manager.call_tool("artifact-server", export_tool, {
            "artifact_id": artifact_id
        })

        output_path = None
        export_err = None
        if hasattr(export_res, "content") and export_res.content:
            raw = export_res.content[0].text
            if "connection closed" in raw.lower():
                export_err = raw
            else:
                try:
                    res_data = json.loads(raw)
                    output_path = res_data.get("path")
                    export_err = res_data.get("error")
                except json.JSONDecodeError:
                    export_err = raw
        elif isinstance(export_res, dict):
            output_path = export_res.get("path")
            export_err = export_res.get("error")

        if not output_path or export_err:
            return _export_fallback_local(
                payload.project_id,
                merged_content,
                format_type,
                final_md_path,
                export_err or "MCP export returned no path",
            )

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
        return _export_fallback_local(
            payload.project_id,
            merged_content,
            format_type,
            final_md_path,
            str(e),
        )
    finally:
        await mcp_manager.disconnect_all()
