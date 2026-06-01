---
description: Apply a newer framework version with migration rules
---

You are executing the **/upgrade-framework** command through the **Windsurf** adapter.

Load and follow the canonical command spec: .writing-framework/commands/upgrade-framework.md

If the command depends on a workflow, phase gate, or multi-step orchestration path, also load the relevant workflow from .writing-framework/workflows/.

This adapter is intentionally thin. Do not redefine command logic here.
