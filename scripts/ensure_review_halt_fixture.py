"""
Ensure the canonical review_halt QA fixture (2b11af3b) has one open blocker ticket.
Run before ui-consult-qa halt checks. Idempotent.
"""
from __future__ import annotations

import sys

# Run from repo root (same as reconcile_all_phases.py)
sys.path.insert(0, ".")

import projects as proj_store

FIXTURE_ID = "2b11af3b"
OPEN_TICKET_ID = "ticket-contradiction"


def main() -> int:
    proj_store.init_db()
    project = proj_store.get_project(FIXTURE_ID)
    if not project:
        print(f"Fixture project {FIXTURE_ID} not found", file=sys.stderr)
        return 1

    state = project.get("state") or {}
    memo = state.get("editorial_memo") or []
    touched = False
    for ticket in memo:
        if ticket.get("ticket_id") == OPEN_TICKET_ID:
            if ticket.get("resolved"):
                ticket["resolved"] = False
                touched = True
            break
    else:
        memo.append({
            "ticket_id": OPEN_TICKET_ID,
            "section_id": "authentication",
            "agent_source": "Fact-Checker",
            "issue_type": "fact-check",
            "description": "Semantic Contradiction: API spec states token expires in '24 hours', but manuscript claims '1 hour'.",
            "severity": "blocker",
            "suggested_fix": "Update the token expiration details in the authentication section to '24 hours'.",
            "resolved": False,
        })
        touched = True

    state["editorial_memo"] = memo
    state["run_phase"] = "review_halt"
    state["ws_signal"] = None
    proj_store.save_project_state(FIXTURE_ID, state, "review_halt")
    print(
        f"{'Updated' if touched else 'OK'}: {FIXTURE_ID} review_halt with open {OPEN_TICKET_ID}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
