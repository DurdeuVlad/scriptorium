"""
Intent router — classifies user messages and builds confirmable action proposals.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from agency_settings import (
    default_agency_settings,
    merge_agency_settings,
    parse_structure_from_text,
)
from orchestrator import NewsroomState, ProposedAction, extract_text, get_executor_llm
from style_packs import default_style_pack_for_domain, list_all_voices
from langchain_core.messages import HumanMessage, SystemMessage

VOICE_ALIASES = {
    "technical documentation": "technical-doc",
    "technical doc": "technical-doc",
    "technical-doc": "technical-doc",
    "general writing": "general-writing",
    "general-writing": "general-writing",
    "internal memo": "internal-memo",
    "internal-memo": "internal-memo",
    "player-facing lore": "lore-player-facing",
    "lore-player-facing": "lore-player-facing",
    "dm guide": "lore-dm",
    "lore-dm": "lore-dm",
    "card flavor": "card-flavor",
    "card-flavor": "card-flavor",
}


class IntentRouteResult(BaseModel):
    intent: str = Field(description="conversation | app_help | consult | action")
    confidence: float = 0.8
    assistant_message: Optional[str] = None
    delegate: Optional[str] = None
    proposed_action: Optional[ProposedAction] = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_proposal(
    kind: str,
    summary: str,
    before: Dict[str, Any],
    after: Dict[str, Any],
    apply_payload: Dict[str, Any],
) -> ProposedAction:
    return ProposedAction(
        proposal_id=str(uuid.uuid4())[:12],
        kind=kind,
        summary=summary,
        before=before,
        after=after,
        apply_payload=apply_payload,
        status="pending",
        created_at=_now_iso(),
    )


def _help_response(user_text: str, phase: str) -> str:
    t = user_text.lower()
    if any(w in t for w in ("export", "docx", "pdf", "download")):
        return (
            "When drafting is complete, use **Export DOCX** or **Export PDF** in the chat action "
            "area, or say \"export pdf\" and confirm the proposal card. Open **Document** in the "
            "header to preview chapters first."
        )
    if any(w in t for w in ("plan", "outline", "brief")):
        return (
            "Open **Document** in the header to see Brief & Outline. During intake and negotiation "
            "you can edit structure, chapter counts, and writing voice there or tell me in chat."
        )
    if "negotiation" in t or "phase" in t:
        return (
            f"You are in the **{phase}** phase. Consult lets us shape the brief; negotiation is "
            "when you review the outline before drafting starts."
        )
    if any(w in t for w in ("chapter", "section", "structure")):
        return (
            "Set chapter and word targets in the Structure card in chat, or say e.g. "
            "\"12 chapters, 80k words\" — I'll propose the change for you to confirm."
        )
    return (
        "I'm Scriptorium — your writing agent. Tell me what you're creating, ask about structure "
        "or voice, or request changes (I'll show a confirm card before applying anything). "
        "Use **Document** in the header to view the plan and chapters."
    )


def _conversation_response(user_text: str, phase: str) -> str:
    t = user_text.lower().strip()
    if t in ("thanks", "thank you", "ty", "ok", "okay", "cool", "great"):
        return "You're welcome. What would you like to adjust next?"
    if any(w in t for w in ("what's next", "what next", "now what")):
        if phase == "intake":
            return "Keep answering intake questions, or say when you're ready to draft the outline."
        if phase == "negotiation":
            return "Review the outline in the Document panel, then confirm starting the draft when ready."
        if phase == "finished":
            return "Edit chapters, export, or tell me if you want to expand the plan."
        return f"We're in **{phase}** — tell me what you'd like to change or ask for help using the app."
    return "Got it. Tell me more about what you'd like to do with this project."


def _detect_style_pack(text: str, project_id: Optional[str]) -> Optional[str]:
    lower = text.lower()
    for alias, pack_id in VOICE_ALIASES.items():
        if alias in lower:
            return pack_id
    if "voice" in lower or "style" in lower or "tone" in lower:
        for v in list_all_voices(project_id):
            if v["name"].lower() in lower or v["id"] in lower:
                return v["id"]
    return None


def _heuristic_action_proposal(
    state: NewsroomState,
    user_text: str,
    project_id: Optional[str],
) -> Optional[ProposedAction]:
    text = user_text.strip()
    lower = text.lower()

    # Pipeline actions
    if re.search(r"\b(draft outline|generate plan|build outline)\b", lower):
        return _new_proposal(
            "generate_plan",
            "Start brief and outline generation",
            {"phase": state.run_phase},
            {"phase": "planning", "intake_status": "complete"},
            {"action": "generate_plan"},
        )
    if re.search(r"\b(approve outline|start drafting|begin drafting)\b", lower) or lower.strip() == "approve":
        sections = len((state.outline or {}).get("sections") or [])
        return _new_proposal(
            "approve_outline",
            f"Confirm outline and start drafting ({sections} chapter(s))",
            {"phase": state.run_phase, "sections": sections},
            {"phase": "drafting"},
            {"action": "approve_outline"},
        )
    if re.search(r"\bexport (pdf|docx)\b", lower):
        fmt = "pdf" if "pdf" in lower else "docx"
        return _new_proposal(
            "export",
            f"Export manuscript as {fmt.upper()}",
            {},
            {"format": fmt},
            {"action": "export", "format": fmt},
        )

    # Agency settings
    parsed = parse_structure_from_text(text)
    if parsed:
        current = merge_agency_settings(
            state.agency_settings or default_agency_settings(state.domain),
            None,
            state.domain,
        )
        merged = merge_agency_settings(current, parsed, state.domain)
        if parsed.get("target_chapter_count"):
            n = parsed["target_chapter_count"]
            merged["min_chapters"] = n
            merged["max_chapters"] = n
        parts = []
        for k, v in parsed.items():
            old = current.get(k)
            if old != v:
                parts.append(f"{k}: {old} → {v}")
        summary = "Update structure: " + ", ".join(parts) if parts else "Update agency settings"
        return _new_proposal(
            "update_agency_settings",
            summary,
            {k: current.get(k) for k in parsed},
            {k: merged.get(k) for k in set(list(parsed.keys()) + list(current.keys())) if merged.get(k) is not None},
            {"agency_settings": {k: merged[k] for k in parsed if merged.get(k) is not None}},
        )

    # Style pack
    pack = _detect_style_pack(text, project_id)
    if pack and any(w in lower for w in ("switch", "use", "change", "set", "voice", "style", "write like")):
        current = state.active_style_pack or default_style_pack_for_domain(state.domain)
        if pack != current:
            return _new_proposal(
                "set_style_pack",
                f"Change writing voice: {current or 'default'} → {pack}",
                {"active_style_pack": current},
                {"active_style_pack": pack},
                {"active_style_pack": pack},
            )

    # Add section
    add_match = re.search(
        r"(?:add|create)\s+(?:a\s+)?(?:section|chapter)\s+(?:on|about)?\s+(.+)",
        text,
        re.I,
    )
    if add_match:
        title = add_match.group(1).strip().rstrip(".")
        outline = dict(state.outline or {"sections": []})
        sections = list(outline.get("sections") or [])
        new_id = f"section_{len(sections) + 1:02d}"
        new_sec = {"id": new_id, "title": title, "goal": f"Cover {title}"}
        return _new_proposal(
            "patch_outline",
            f"Add chapter: “{title}”",
            {"sections_count": len(sections)},
            {"sections_count": len(sections) + 1, "new_section": new_sec},
            {"outline": {"sections": sections + [new_sec]}},
        )

    return None


async def _llm_route(
    state: NewsroomState,
    user_text: str,
    project_id: Optional[str],
) -> IntentRouteResult:
    llm = get_executor_llm()
    if not llm:
        return IntentRouteResult(intent="consult", confidence=0.5, delegate="consult")

    system = (
        "You are the Scriptorium intent router. Classify the user message. "
        "Respond ONLY with JSON: {"
        '"intent": "conversation"|"app_help"|"consult"|"action", '
        '"confidence": number, '
        '"assistant_message": string|null, '
        '"action_kind": string|null, '
        '"apply_payload": object|null, '
        '"summary": string|null'
        "}. "
        "Use action for any state change (settings, outline, voice, draft, export, approve). "
        "Use app_help for how-to questions about the UI. "
        "Use consult for planning discussion without explicit mutation. "
        "Use conversation for thanks/acknowledgments."
    )
    user = (
        f"Phase: {state.run_phase}\n"
        f"Agency settings: {json.dumps(state.agency_settings or {})}\n"
        f"Outline sections: {len((state.outline or {}).get('sections') or [])}\n"
        f"Active voice: {state.active_style_pack}\n"
        f"User: {user_text}"
    )
    try:
        resp = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=user)])
        raw = extract_text(resp.content).strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)
    except Exception:
        return IntentRouteResult(intent="consult", confidence=0.5, delegate="consult")

    intent = data.get("intent") or "consult"
    if intent == "action" and data.get("apply_payload"):
        kind = data.get("action_kind") or "custom_action"
        payload = data.get("apply_payload") or {}
        before, after = {}, payload
        if kind == "update_agency_settings":
            current = state.agency_settings or {}
            before = {k: current.get(k) for k in payload.get("agency_settings", payload)}
            merged = merge_agency_settings(current, payload.get("agency_settings", payload), state.domain)
            after = {k: merged.get(k) for k in before.keys() | payload.get("agency_settings", payload).keys()}
            payload = {"agency_settings": payload.get("agency_settings", payload)}
        proposal = _new_proposal(
            kind,
            data.get("summary") or "Proposed change",
            before,
            after,
            payload,
        )
        return IntentRouteResult(
            intent="action",
            confidence=float(data.get("confidence") or 0.8),
            assistant_message=data.get("assistant_message"),
            proposed_action=proposal,
        )

    return IntentRouteResult(
        intent=intent,
        confidence=float(data.get("confidence") or 0.8),
        assistant_message=data.get("assistant_message"),
        delegate="consult" if intent == "consult" else None,
    )


async def route_user_intent(
    state: NewsroomState,
    user_text: str,
    project_id: Optional[str] = None,
) -> IntentRouteResult:
    """Classify user message; build proposal for mutations without applying."""
    text = (user_text or "").strip()
    if not text:
        return IntentRouteResult(intent="conversation", assistant_message="Say what you'd like to do.")

    lower = text.lower()

    # App help keywords
    if any(
        phrase in lower
        for phrase in (
            "how do i",
            "how to",
            "where do i",
            "where is",
            "what does",
            "what is the",
            "help me use",
            "how does this app",
        )
    ):
        return IntentRouteResult(
            intent="app_help",
            confidence=0.9,
            assistant_message=_help_response(text, state.run_phase or "idle"),
        )

    # Short acknowledgments
    if len(text.split()) <= 4 and any(
        w in lower for w in ("thanks", "thank you", "ok", "okay", "cool", "great", "nice")
    ):
        return IntentRouteResult(
            intent="conversation",
            confidence=0.85,
            assistant_message=_conversation_response(text, state.run_phase or "idle"),
        )

    # Heuristic action detection (mutations always get proposals)
    proposal = _heuristic_action_proposal(state, text, project_id)
    if proposal:
        msg = f"I can do that — review the proposed change and confirm when ready."
        return IntentRouteResult(
            intent="action",
            confidence=0.88,
            assistant_message=msg,
            proposed_action=proposal,
        )

    # Mutation-ish keywords without parseable payload → LLM or consult
    mutation_hints = (
        "chapter", "section", "word", "voice", "style", "outline", "draft",
        "export", "approve", "change", "set ", "update", "add ", "remove",
    )
    if any(h in lower for h in mutation_hints):
        llm_result = await _llm_route(state, text, project_id)
        if llm_result.intent == "action" and llm_result.proposed_action:
            return llm_result
        if llm_result.intent == "consult":
            return IntentRouteResult(intent="consult", delegate="consult", confidence=0.7)

    # Default: consult (planning conversation)
    return IntentRouteResult(intent="consult", delegate="consult", confidence=0.75)
