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


def delete_project(project_id: str):
    """Remove the project from the DB and delete its directory tree."""
    init_db()
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
