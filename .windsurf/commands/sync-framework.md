---
description: Full framework sync against canonical source, with conflict detection
---

You are executing the **/sync-framework** command through the **Windsurf** adapter.

Load and follow the canonical command spec: .writing-framework/commands/sync-framework.md

If the command depends on a workflow, phase gate, or multi-step orchestration path, also load the relevant workflow from .writing-framework/workflows/.

This adapter is intentionally thin. Do not redefine command logic here.
