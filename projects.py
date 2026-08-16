"""
projects.py — Project registry backed by SQLite.

Each project gets an isolated directory:
  projects/<project_id>/
    artifacts/        ← chapter .md files
    db/
      semantic.db
      compliance.db

The DB stores project metadata + a serialised NewsroomState snapshot
so the UI can restore full pipeline state after a page refresh or
project switch without re-running the pipeline.
"""

import json
import os
import shutil
import sqlite3
import uuid
from datetime import datetime

from agency_settings import (
    default_agency_settings,
    merge_agency_settings,
    validate_outline_against_settings,
)

PROJECTS_DB = "projects.db"
PROJECTS_DIR = "projects"


# ── Database bootstrap ────────────────────────────────────────────────────────

def init_db():
    """Ensure the projects database and table exist."""
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    with sqlite3.connect(PROJECTS_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                prompt      TEXT NOT NULL,
                audience    TEXT NOT NULL,
                domain      TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                phase       TEXT DEFAULT 'idle',
                state_json  TEXT DEFAULT '{}'
            )
        """)
        conn.commit()


# ── Name generation ───────────────────────────────────────────────────────────

def _auto_name(prompt: str) -> str:
    """Return the first 6 words of the prompt, with an ellipsis if truncated."""
    words = prompt.strip().split()
    name = " ".join(words[:6])
    if len(words) > 6:
        name += "…"
    return name


# ── CRUD ─────────────────────────────────────────────────────────────────────

def create_project(prompt: str, audience: str, domain: str, name: str = None) -> dict:
    """
    Create a new project entry and its isolated filesystem directory.
    Returns the project metadata dict (no state blob).
    """
    init_db()
    project_id = str(uuid.uuid4())[:8]
    project_name = name or _auto_name(prompt)
    created_at = datetime.utcnow().isoformat()

    # Isolated directory structure
    base = os.path.join(PROJECTS_DIR, project_id)
    os.makedirs(os.path.join(base, "artifacts"), exist_ok=True)
    os.makedirs(os.path.join(base, "db"), exist_ok=True)

    with sqlite3.connect(PROJECTS_DB) as conn:
        conn.execute(
            """INSERT INTO projects (id, name, prompt, audience, domain, created_at, phase, state_json)
               VALUES (?, ?, ?, ?, ?, ?, 'idle', '{}')""",
            (project_id, project_name, prompt, audience, domain, created_at),
        )
        conn.commit()

    return {
        "id": project_id,
        "name": project_name,
        "prompt": prompt,
        "audience": audience,
        "domain": domain,
        "created_at": created_at,
        "phase": "idle",
    }


def list_projects() -> list:
    """Return all projects sorted newest-first (no state blob — metadata only)."""
    init_db()
    with sqlite3.connect(PROJECTS_DB) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """SELECT id, name, prompt, audience, domain, created_at, phase
               FROM projects ORDER BY created_at DESC"""
        ).fetchall()
    return [dict(r) for r in rows]


def get_project(project_id: str) -> dict | None:
    """Return the full project record including the deserialised state snapshot."""
    init_db()
    with sqlite3.connect(PROJECTS_DB) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
    if not row:
        return None
    data = dict(row)
    raw = data.pop("state_json", "{}")
    data["state"] = json.loads(raw or "{}")
    return data


def save_project_state(project_id: str, state_dict: dict, phase: str):
    """Upsert the serialised NewsroomState snapshot and current phase."""
    init_db()
    with sqlite3.connect(PROJECTS_DB) as conn:
        conn.execute(
            "UPDATE projects SET state_json = ?, phase = ? WHERE id = ?",
            (json.dumps(state_dict), phase, project_id),
        )
        conn.commit()


def merge_plan_in_state(
    state: dict,
    brief: dict | None = None,
    outline: dict | None = None,
    agency_settings: dict | None = None,
) -> dict:
    """Deep-merge brief/outline/agency_settings patches into a state dict."""
    domain = (state.get("brief") or {}).get("domain") or state.get("domain") or "technical-docs"
    if agency_settings is not None:
        state["agency_settings"] = merge_agency_settings(
            state.get("agency_settings"),
            agency_settings,
            domain,
        )
    if brief is not None:
        existing = state.get("brief") or {}
        if isinstance(existing, dict) and isinstance(brief, dict):
            merged = {**existing, **brief}
            if "constraints" in brief and isinstance(brief.get("constraints"), list):
                merged["constraints"] = brief["constraints"]
            state["brief"] = merged
        else:
            state["brief"] = brief
    if outline is not None:
        existing = state.get("outline") or {}
        if isinstance(existing, dict) and isinstance(outline, dict):
            if outline.get("sections") is not None:
                state["outline"] = {**existing, **outline}
            else:
                state["outline"] = {**existing, **outline}
        else:
            state["outline"] = outline
    return state


def update_project_plan(
    project_id: str,
    brief: dict | None,
    outline: dict | None,
    agency_settings: dict | None = None,
) -> dict:
    """Merge brief/outline/agency_settings into the stored state snapshot."""
    project = _require_project(project_id)
    phase = project.get("phase") or "idle"
    if phase not in ("negotiation", "planning", "idle", "intake", "review_halt"):
        raise ValueError(f"Plan cannot be edited in phase: {phase}")

    state = project.get("state") or {}
    if not state.get("agency_settings"):
        state["agency_settings"] = default_agency_settings(project.get("domain", "technical-docs"))
    merge_plan_in_state(state, brief, outline, agency_settings)

    settings = state.get("agency_settings") or {}
    outline_data = state.get("outline")
    ok, err = validate_outline_against_settings(outline_data, settings)
    if not ok and outline_data and outline_data.get("sections"):
        raise ValueError(err)

    save_project_state(project_id, state, phase)
    return {
        "brief": state.get("brief"),
        "outline": state.get("outline"),
        "agency_settings": state.get("agency_settings"),
    }


def delete_project(project_id: str):
    """Remove the project from the DB and delete its directory tree."""
    init_db()
    if get_project(project_id):
        base = os.path.join(PROJECTS_DIR, project_id)
        if os.path.exists(base):
            shutil.rmtree(base)
    with sqlite3.connect(PROJECTS_DB) as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()


# ── Path helpers ──────────────────────────────────────────────────────────────

def get_project_paths(project_id: str) -> dict:
    """Return the three key filesystem paths for a project."""
    base = os.path.join(PROJECTS_DIR, project_id)
    return {
        "project_path":        os.path.join(base, "artifacts"),
        "rdf_db_path":         os.path.join(base, "db", "semantic.db"),
        "compliance_db_path":  os.path.join(base, "db", "compliance.db"),
    }


def _require_project(project_id: str) -> dict:
    project = get_project(project_id)
    if not project:
        raise FileNotFoundError(f"Project not found: {project_id}")
    return project


def _artifact_file_path(project_id: str, artifact_id: str) -> str:
    """Resolve artifact_id to a markdown file path."""
    safe_id = artifact_id.replace(".md", "").strip().replace("/", "").replace("\\", "")
    if not safe_id:
        raise ValueError("Invalid artifact id")
    if safe_id == "final_manuscript":
        return os.path.join(PROJECTS_DIR, project_id, "final_manuscript.md")
    return os.path.join(get_project_paths(project_id)["project_path"], f"{safe_id}.md")


def list_artifacts(project_id: str) -> list:
    """List markdown artifacts for a project."""
    _require_project(project_id)
    artifacts_dir = get_project_paths(project_id)["project_path"]
    os.makedirs(artifacts_dir, exist_ok=True)
    items = []
    seen_ids = set()
    for name in sorted(os.listdir(artifacts_dir)):
        if not name.endswith(".md"):
            continue
        artifact_id = name[:-3]
        if artifact_id in seen_ids:
            continue
        path = os.path.join(artifacts_dir, name)
        mtime = os.path.getmtime(path)
        kind = "export" if artifact_id == "final_manuscript" else "chapter"
        items.append({
            "id": artifact_id,
            "filename": name,
            "kind": kind,
            "updated_at": datetime.utcfromtimestamp(mtime).isoformat() + "Z",
        })
        seen_ids.add(artifact_id)

    final_path = os.path.join(PROJECTS_DIR, project_id, "final_manuscript.md")
    if os.path.isfile(final_path) and "final_manuscript" not in seen_ids:
        mtime = os.path.getmtime(final_path)
        items.append({
            "id": "final_manuscript",
            "filename": "final_manuscript.md",
            "kind": "export",
            "updated_at": datetime.utcfromtimestamp(mtime).isoformat() + "Z",
        })

    return items


def read_artifact(project_id: str, artifact_id: str) -> str:
    _require_project(project_id)
    path = _artifact_file_path(project_id, artifact_id)
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Artifact not found: {artifact_id}")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_artifact(project_id: str, artifact_id: str, content: str) -> dict:
    _require_project(project_id)
    path = _artifact_file_path(project_id, artifact_id)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    mtime = os.path.getmtime(path)
    return {
        "id": artifact_id.replace(".md", ""),
        "filename": os.path.basename(path),
        "updated_at": datetime.utcfromtimestamp(mtime).isoformat() + "Z",
    }
