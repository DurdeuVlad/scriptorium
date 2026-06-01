import json
import asyncio
import uuid
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from orchestrator import build_graph, NewsroomState

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# File system watcher to stream updates
class ArtifactHandler(FileSystemEventHandler):
    def __init__(self, loop):
        self.loop = loop

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.md'):
            filename = os.path.basename(event.src_path)
            try:
                with open(event.src_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({
                        "type": "file_update",
                        "filename": filename,
                        "content": content
                    }),
                    self.loop
                )
            except Exception as e:
                print(f"Error watching file: {e}")

@app.on_event("startup")
async def startup_event():
    # Start file system watcher
    loop = asyncio.get_running_loop()
    event_handler = ArtifactHandler(loop)
    observer = Observer()
    os.makedirs("artifacts", exist_ok=True)
    observer.schedule(event_handler, path="artifacts", recursive=False)
    observer.start()
    app.state.observer = observer

@app.on_event("shutdown")
async def shutdown_event():
    app.state.observer.stop()
    app.state.observer.join()

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # We compile the LangGraph
    graph = build_graph()
    state = None
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "start_run":
                print("WebSocket received: start_run")
                run_id = str(uuid.uuid4())
                state = NewsroomState(
                    run_id=run_id,
                    project_path="artifacts",
                    prompt=message.get("prompt", "AI for Beginners"),
                    target_audience=message.get("target_audience", "non-technical people"),
                    domain=message.get("domain", "technical-docs"),
                    rdf_db_path="db/semantic.db",
                    compliance_db_path="db/compliance.db"
                )
                
                # Stream initial state
                await websocket.send_json({
                    "type": "status_update",
                    "run_id": run_id,
                    "phase": "intake",
                    "message": "Initiating newsroom state machine..."
                })
                
                # Execute first steps (Intake -> Outline Planning)
                # We invoke the graph; it will now route to END at the negotiate_outline node if ws_signal is not outline_approved
                result = await graph.ainvoke(state.dict())
                state = NewsroomState(**result)
                
                # Broadcast updated outline and let UI know we are in negotiation phase
                await websocket.send_json({
                    "type": "outline_proposal",
                    "brief": state.brief,
                    "outline": state.outline,
                    "phase": state.run_phase
                })
                
            elif message.get("type") == "approve_outline":
                print("WebSocket received: approve_outline")
                if state:
                    state.ws_signal = "outline_approved"
                    state.run_phase = "negotiation"  # Set to negotiation so route_newsroom can transition it to drafting
                    
                    # Resume graph execution
                    await websocket.send_json({
                        "type": "status_update",
                        "phase": "drafting",
                        "message": "Outline approved. Starting deep drafting phase..."
                    })
                    
                    result = await graph.ainvoke(state.dict())
                    state = NewsroomState(**result)
                    
                    # Stream completion status
                    await websocket.send_json({
                        "type": "run_complete",
                        "manuscript": state.manuscript,
                        "editorial_memo": [t.dict() for t in state.editorial_memo],
                        "phase": state.run_phase
                    })
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected.")
    except Exception as e:
        print(f"WebSocket Error: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
        manager.disconnect(websocket)

