"""
Apply confirmed action proposals to project state.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

import projects as proj_store
from agency_settings import merge_agency_settings, validate_outline_against_settings
from orchestrator import NewsroomState, ProposedAction


class ApplyResult:
    def __init__(
        self,
        success: bool = True,
        message: str = "",
        plan_patch: Optional[Dict[str, Any]] = None,
        run_phase: Optional[str] = None,
        intake_status: Optional[str] = None,
        pipeline_action: Optional[str] = None,
        export_format: Optional[str] = None,
        ws_signal: Optional[str] = None,
    ):
        self.success = success
        self.message = message
        self.plan_patch = plan_patch
        self.run_phase = run_phase
        self.intake_status = intake_status
        self.pipeline_action = pipeline_action
        self.export_format = export_format
        self.ws_signal = ws_signal


def apply_proposed_action(
    state: NewsroomState,
    proposal: ProposedAction,
    project_id: Optional[str] = None,
) -> ApplyResult:
    """Apply a confirmed proposal. Mutates state in place."""
    kind = proposal.kind
    payload = proposal.apply_payload or {}

    if kind == "update_agency_settings":
        patch = payload.get("agency_settings") or payload
        state.agency_settings = merge_agency_settings(
            state.agency_settings, patch, state.domain
        )
        return ApplyResult(
            message=f"Applied: {proposal.summary}",
            plan_patch={"agency_settings": state.agency_settings},
        )

    if kind == "set_style_pack":
        pack = payload.get("active_style_pack") or payload.get("style_pack")
        if pack:
            state.active_style_pack = pack
            brief = dict(state.brief or {})
            brief["style_pack"] = pack
            state.brief = brief
        return ApplyResult(
            message=f"Applied: {proposal.summary}",
            plan_patch={
                "brief": state.brief,
                "active_style_pack": state.active_style_pack,
            },
        )

    if kind == "patch_brief":
        brief_patch = payload.get("brief") or payload
        brief = {**(state.brief or {}), **brief_patch}
        state.brief = brief
        return ApplyResult(
            message=f"Applied: {proposal.summary}",
            plan_patch={"brief": state.brief},
        )

    if kind == "patch_outline":
        outline_patch = payload.get("outline") or payload
        if outline_patch.get("sections") is not None:
            outline = {**(state.outline or {}), **outline_patch}
        else:
            outline = {**(state.outline or {}), **outline_patch}
        ok, err = validate_outline_against_settings(outline, state.agency_settings)
        if not ok:
            return ApplyResult(success=False, message=err)
        state.outline = outline
        return ApplyResult(
            message=f"Applied: {proposal.summary}",
            plan_patch={"outline": state.outline},
        )

    if kind == "generate_plan":
        state.intake_status = "complete"
        return ApplyResult(
            message="Starting plan generation.",
            intake_status="complete",
            run_phase="planning",
            pipeline_action="generate_plan",
        )

    if kind == "approve_outline":
        ok, err = validate_outline_against_settings(state.outline, state.agency_settings)
        if not ok:
            return ApplyResult(success=False, message=err)
        return ApplyResult(
            message="Outline confirmed — starting draft.",
            run_phase="negotiation",
            pipeline_action="approve_outline",
            ws_signal="outline_approved",
        )

    if kind == "export":
        fmt = payload.get("format") or "docx"
        return ApplyResult(
            message=f"Exporting {fmt.upper()}…",
            pipeline_action="export",
            export_format=fmt,
        )

    return ApplyResult(success=False, message=f"Unknown action kind: {kind}")


def cancel_proposal(state: NewsroomState) -> str:
    if state.pending_proposal:
        state.pending_proposal = state.pending_proposal.model_copy(update={"status": "cancelled"})
        pid = state.pending_proposal.proposal_id
        state.pending_proposal = None
        return f"Cancelled proposal {pid}."
    return "No pending proposal to cancel."


def confirm_proposal(
    state: NewsroomState,
    proposal_id: str,
    project_id: Optional[str] = None,
) -> Tuple[Optional[ApplyResult], Optional[str]]:
    pending = state.pending_proposal
    if not pending or pending.proposal_id != proposal_id:
        return None, "That proposal is no longer active. It may have expired or already been handled."
    if pending.status != "pending":
        return None, f"Proposal already {pending.status}."

    result = apply_proposed_action(state, pending, project_id)
    if not result.success:
        return result, result.message

    state.pending_proposal = pending.model_copy(update={"status": "confirmed"})
    state.pending_proposal = None
    return result, result.message
