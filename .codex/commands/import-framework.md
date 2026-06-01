---
description: Import framework updates from another repo or exported bundle
---

You are executing the **`/import-framework`** command through the **Codex** adapter.

Load and follow the canonical command spec: `.writing-framework/commands/import-framework.md`

If the command depends on a workflow, phase gate, or multi-step orchestration path, also load the relevant workflow from `.writing-framework/workflows/`.

This adapter is intentionally thin. Do not redefine command logic here.
