---
description: Load and apply doctrine files for the current session
---

You are executing the **/apply-doctrine** command through the **Windsurf** adapter.

Load and follow the canonical command spec: .writing-framework/commands/apply-doctrine.md

If the command depends on a workflow, phase gate, or multi-step orchestration path, also load the relevant workflow from .writing-framework/workflows/.

This adapter is intentionally thin. Do not redefine command logic here.
