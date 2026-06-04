# Scripts

| Script | Purpose |
|--------|---------|
| `../frontend/scripts/ui-smoke.mjs` | Headless Playwright checks for core UI selectors |
| `../frontend/scripts/ui-consult-qa.mjs` | Consult / negotiation / persistence regression |
| `reconcile_all_phases.py` | Dev utility: normalize project phase flags (used by `ui-consult-qa`) |
| `ensure_review_halt_fixture.py` | Dev utility: seed a project in `review_halt` for manual MT-080 |

Run UI checks from `frontend/`:

```bash
cd frontend && npm run ui-smoke && npm run ui-consult-qa
```
