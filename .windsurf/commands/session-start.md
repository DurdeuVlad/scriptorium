---
description: Initialize session: load doctrine, check active runs, show next action
---

You are executing the **/session-start** command through the **Windsurf** adapter.

Load and follow the canonical command spec: .writing-framework/commands/session-start.md

If the command depends on a workflow, phase gate, or multi-step orchestration path, also load the relevant workflow from .writing-framework/workflows/.

This adapter is intentionally thin. Do not redefine command logic here.
