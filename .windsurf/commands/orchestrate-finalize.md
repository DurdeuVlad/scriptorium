---
description: Full finalization: voice pass â†’ compress â†’ publication check â†’ gate
---

You are executing the **/orchestrate-finalize** command through the **Windsurf** adapter.

Load and follow the canonical command spec: .writing-framework/commands/orchestrate-finalize.md

If the command depends on a workflow, phase gate, or multi-step orchestration path, also load the relevant workflow from .writing-framework/workflows/.

This adapter is intentionally thin. Do not redefine command logic here.
