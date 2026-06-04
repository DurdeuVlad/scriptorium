"""Seed project phase for ui-proposal-qa.mjs. Usage: python scripts/seed_proposal_qa_phase.py <id> <intake_status> <run_phase> <phase>"""
from __future__ import annotations

import sys

sys.path.insert(0, ".")

import projects as proj_store


def main() -> int:
    if len(sys.argv) != 5:
        print("Usage: seed_proposal_qa_phase.py <project_id> <intake_status> <run_phase> <phase>", file=sys.stderr)
        return 1
    project_id, intake_status, run_phase, phase = sys.argv[1:5]
    proj_store.init_db()
    project = proj_store.get_project(project_id)
    if not project:
        print(f"Project {project_id} not found", file=sys.stderr)
        return 1
    state = project.get("state") or {}
    state["intake_status"] = intake_status
    state["run_phase"] = run_phase
    proj_store.save_project_state(project_id, state, phase)
    print("ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
