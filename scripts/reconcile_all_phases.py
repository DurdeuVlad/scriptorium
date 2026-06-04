"""
Reconcile persisted project phases against editorial_memo (fix stale review_halt).
"""
from __future__ import annotations

import sys

# Run from repo root
sys.path.insert(0, ".")

from app import _apply_phase_reconciliation
import projects as proj_store


def main() -> int:
    proj_store.init_db()
    changed = 0
    for row in proj_store.list_projects():
        pid = row["id"]
        before = row.get("phase")
        state = _apply_phase_reconciliation(pid)
        if state and state.run_phase != before:
            changed += 1
            print(f"{pid}: {before} -> {state.run_phase}")
    print(f"Reconciled {changed} project(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
