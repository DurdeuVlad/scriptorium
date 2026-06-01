---
description: Aggregate all QA outputs and issue final gate decision: ACCEPT/REVISE/BLOCK
---

You are executing the **/qa-final** command through the **GitHub Copilot** adapter.

Load and follow the canonical command spec: .writing-framework/commands/qa-final.md

If the command depends on a workflow, phase gate, or multi-step orchestration path, also load the relevant workflow from .writing-framework/workflows/.

This adapter is intentionally thin. Do not redefine command logic here.
