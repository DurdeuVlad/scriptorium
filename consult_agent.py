"""
Lightweight consulting turns — one LLM call per user message, no full LangGraph invoke.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from orchestrator import (
    ConversationMessage,
    EditTicket,
    NewsroomState,
    PendingPrompt,
    extract_text,
    get_planner_llm,
)
from langchain_core.messages import HumanMessage, SystemMessage

import projects as proj_store
from agency_settings import (
    default_agency_settings,
    merge_agency_settings,
    parse_structure_from_text,
)
from style_packs import default_style_pack_for_domain, list_all_voices

MAX_INTAKE_TURNS = 12
# Phases where LangGraph is actively running — not post-sign-off (publishing/finished).
BUSY_PHASES = frozenset(
    {"drafting", "scrubbing", "copyediting", "reviewing", "planning"}
)

INTAKE_QUESTION_TEMPLATES = [
    {
        "field": "audience",
        "question": "Who is the primary reader? Describe their background and what they need from this document.",
    },
    {
        "field": "tone",
        "question": "What tone should we aim for?",
    },
    {
        "field": "structure",
        "question": "How big should this be? Pick a chapter count and word budget, or describe it in your own words.",
    },
    {
        "field": "voice",
        "question": "Which writing voice fits best?",
    },
    {
        "field": "constraints",
        "question": "Any constraints — format, must-include topics, or things to avoid?",
    },
]

INTAKE_CHOICES_BY_DOMAIN = {
    "technical-docs": {
        "audience": ["Developers", "DevOps engineers", "Technical PMs", "Business stakeholders"],
        "tone": ["Professional", "Technical", "Conversational", "Friendly"],
        "structure": [
            "6 sections, ~8k words",
            "4 sections, ~5k words",
            "8 sections, ~12k words",
            "I'll specify in chat",
        ],
        "voice": ["Technical documentation", "General writing", "Internal memo"],
        "constraints": ["Keep it short", "Include examples", "Compliance-focused", "No preference"],
    },
    "creative-book": {
        "audience": ["General readers", "Hobbyists", "Students", "Book club readers"],
        "tone": ["Conversational", "Friendly", "Literary", "Professional"],
        "structure": [
            "12 chapters, ~80k words",
            "10 chapters, ~60k words",
            "8 chapters, ~40k words",
            "3 subsections per chapter",
            "I'll specify in chat",
        ],
        "voice": ["General writing", "Literary / player-facing lore", "DM guide style"],
        "constraints": ["Keep chapters short", "Include examples", "No preference"],
    },
}


def intake_choices_for_domain(domain: str, field: str) -> List[str]:
    d = (domain or "technical-docs").lower()
    key = "creative-book" if "book" in d or "creative" in d else "technical-docs"
    table = INTAKE_CHOICES_BY_DOMAIN.get(key, INTAKE_CHOICES_BY_DOMAIN["technical-docs"])
    return list(table.get(field, INTAKE_CHOICES_BY_DOMAIN["technical-docs"].get(field, [])))


def intake_questions_for_domain(domain: str) -> List[dict]:
    out = []
    for t in INTAKE_QUESTION_TEMPLATES:
        out.append({
            "field": t["field"],
            "question": t["question"],
            "choices": intake_choices_for_domain(domain, t["field"]),
        })
    return out


class ConsultResult(BaseModel):
    assistant_message: Optional[str] = None
    plan_patch: Optional[Dict[str, Any]] = None
    assistant_question: Optional[Dict[str, Any]] = None
    intake_status: Optional[str] = None
    pending_prompt: Optional[Dict[str, Any]] = None
    editorial_memo: Optional[List[EditTicket]] = None
    ws_signal: Optional[str] = None
    run_phase: Optional[str] = None
    resume_pipeline: bool = False
    conversation_append: List[ConversationMessage] = Field(default_factory=list)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _user_turn_count(state: NewsroomState) -> int:
    return sum(1 for m in state.conversation if m.role == "user")


def _append_message(
    state: NewsroomState,
    role: str,
    content: str,
    meta: Optional[Dict[str, Any]] = None,
) -> ConversationMessage:
    msg = ConversationMessage(role=role, content=content, ts=_now_iso(), meta=meta or {})
    state.conversation = list(state.conversation) + [msg]
    return msg


def _brief_from_state(state: NewsroomState) -> Dict[str, Any]:
    brief = dict(state.brief or {})
    if not brief.get("goal"):
        brief["goal"] = state.prompt
    if not brief.get("audience") and state.target_audience:
        brief["audience"] = state.target_audience
    if not brief.get("domain"):
        brief["domain"] = state.domain
    if not brief.get("title") and state.prompt:
        words = state.prompt.strip().split()[:8]
        brief["title"] = " ".join(words) + ("…" if len(state.prompt.split()) > 8 else "")
    return brief


VOICE_CHOICE_MAP = {
    "technical documentation": "technical-doc",
    "technical doc": "technical-doc",
    "general writing": "general-writing",
    "internal memo": "internal-memo",
    "literary / player-facing lore": "lore-player-facing",
    "player-facing lore": "lore-player-facing",
    "dm guide style": "lore-dm",
    "dm guide": "lore-dm",
    "card flavor": "card-flavor",
}


def _voice_choices_for_domain(domain: str) -> List[str]:
    d = (domain or "technical-docs").lower()
    key = "creative-book" if "book" in d or "creative" in d else "technical-docs"
    return list(INTAKE_CHOICES_BY_DOMAIN.get(key, {}).get("voice", ["General writing"]))


def _apply_structure_choice(text: str, domain: str) -> Dict[str, Any]:
    """Parse quick-reply structure choices into agency_settings."""
    t = text.lower().strip()
    settings = default_agency_settings(domain)
    import re

    m = re.search(r"(\d+)\s*chapters?", t)
    if m:
        n = int(m.group(1))
        settings["target_chapter_count"] = n
        settings["min_chapters"] = n
        settings["max_chapters"] = n

    m = re.search(r"(\d+)\s*sections?", t)
    if m:
        n = int(m.group(1))
        settings["target_chapter_count"] = n
        settings["min_chapters"] = n
        settings["max_chapters"] = n

    m = re.search(r"(\d+)\s*k\s*words?", t)
    if m:
        settings["target_word_count"] = int(m.group(1)) * 1000
    else:
        m = re.search(r"~?\s*(\d+)\s*k?\s*words?", t)
        if m:
            n = int(m.group(1))
            settings["target_word_count"] = n * 1000 if n < 500 else n

    if "subsection" in t or "subchapter" in t:
        m = re.search(r"(\d+)\s*sub", t)
        if m:
            settings["target_subsections_per_chapter"] = int(m.group(1))
        settings["max_subsection_depth"] = 2

    if settings.get("target_word_count") and settings.get("target_chapter_count"):
        settings["words_per_chapter"] = (
            settings["target_word_count"] // settings["target_chapter_count"]
        )

    return settings


def _apply_voice_choice(text: str) -> str:
    key = text.lower().strip()
    return VOICE_CHOICE_MAP.get(key, default_style_pack_for_domain("technical-docs"))


def _intake_field_filled(brief: Dict[str, Any], field: str, state: Optional[NewsroomState] = None) -> bool:
    if field == "audience":
        return state_audience_ok(brief)
    if field == "tone":
        return bool(brief.get("tone"))
    if field == "structure":
        if state and state.agency_settings:
            ag = state.agency_settings
            return bool(ag.get("target_chapter_count") or ag.get("target_word_count"))
        return False
    if field == "voice":
        if state and state.active_style_pack:
            return bool(state.active_style_pack)
        return bool(brief.get("style_pack"))
    if field == "constraints":
        c = brief.get("constraints")
        return c is not None and (isinstance(c, list) and len(c) > 0 or isinstance(c, str))
    return False


def state_audience_ok(brief: Dict[str, Any]) -> bool:
    aud = brief.get("audience")
    return isinstance(aud, str) and len(aud.strip()) > 3


def _next_intake_question(
    brief: Dict[str, Any],
    domain: str = "technical-docs",
    state: Optional[NewsroomState] = None,
) -> Optional[PendingPrompt]:
    for q in intake_questions_for_domain(domain):
        if not _intake_field_filled(brief, q["field"], state):
            choices = q["choices"]
            if q["field"] == "voice":
                choices = _voice_choices_for_domain(domain)
            return PendingPrompt(
                field=q["field"],
                question=q["question"],
                choices=choices,
            )
    return None


def _apply_choice_to_brief(
    brief: Dict[str, Any],
    field: str,
    text: str,
    state: Optional[NewsroomState] = None,
) -> Dict[str, Any]:
    text = text.strip()
    if field == "audience":
        brief["audience"] = text
    elif field == "tone":
        brief["tone"] = text
    elif field == "structure":
        if state is not None:
            domain = brief.get("domain") or (state.domain if state else "technical-docs")
            if text.lower() not in ("i'll specify in chat", "i will specify in chat"):
                state.agency_settings = merge_agency_settings(
                    state.agency_settings,
                    _apply_structure_choice(text, domain),
                    domain,
                )
            else:
                parsed = parse_structure_from_text(text)
                if parsed:
                    state.agency_settings = merge_agency_settings(
                        state.agency_settings, parsed, domain
                    )
    elif field == "voice":
        pack_id = _apply_voice_choice(text)
        brief["style_pack"] = pack_id
        if state is not None:
            state.active_style_pack = pack_id
    elif field == "constraints":
        if text.lower() in ("no preference", "none", "n/a"):
            brief["constraints"] = []
        else:
            brief["constraints"] = [text]
    return brief


def _heuristic_intake_patch(state: NewsroomState, user_text: str) -> Dict[str, Any]:
    brief = _brief_from_state(state)
    pending = state.pending_prompt
    if pending and pending.field:
        brief = _apply_choice_to_brief(brief, pending.field, user_text, state)
    else:
        if not brief.get("audience") or brief.get("audience") == state.target_audience:
            if len(user_text) > 10:
                brief["audience"] = user_text
        if not brief.get("goal"):
            brief["goal"] = state.prompt
        if re.search(r"\bbook\b", user_text, re.I):
            brief["deliverable"] = "book"
        parsed = parse_structure_from_text(user_text)
        if parsed:
            state.agency_settings = merge_agency_settings(
                state.agency_settings, parsed, state.domain
            )
    if not state.agency_settings:
        state.agency_settings = default_agency_settings(state.domain)
    if not state.active_style_pack:
        state.active_style_pack = default_style_pack_for_domain(state.domain)
        brief["style_pack"] = state.active_style_pack
    return brief


def _intake_complete(brief: Dict[str, Any], turn_count: int, state: Optional[NewsroomState] = None) -> bool:
    if turn_count >= MAX_INTAKE_TURNS:
        return True
    domain = brief.get("domain") or "technical-docs"
    for q in intake_questions_for_domain(domain):
        if not _intake_field_filled(brief, q["field"], state):
            return False
    return True


async def _llm_consult(
    state: NewsroomState,
    user_text: str,
    mode: str,
) -> ConsultResult:
    llm = get_planner_llm()
    if not llm:
        return ConsultResult()

    brief = _brief_from_state(state)
    history = state.conversation[-20:]
    hist_lines = "\n".join(f"{m.role}: {m.content}" for m in history)

    system = (
        "You are Scriptorium — the user's main writing agent. Respond with ONLY valid JSON, no markdown fences. "
        "Schema: {"
        '"assistant_message": string, '
        '"plan_patch": {"brief": object?, "outline": object?, "agency_settings": object?, "active_style_pack": string?} or null, '
        '"assistant_question": {"question": string, "choices": string[], "field": string?} or null, '
        '"intake_status": "in_progress"|"complete"|null, '
        '"resolve_ticket_ids": string[]'
        "}. "
        f"Mode: {mode}. Phase: {state.run_phase}. "
        "In intake mode, extract audience/tone/constraints into plan_patch.brief and "
        "chapter/word counts into plan_patch.agency_settings (target_chapter_count, target_word_count, "
        "words_per_chapter, target_subsections_per_chapter, max_subsection_depth). "
        "Map voice requests to plan_patch.active_style_pack (technical-doc, general-writing, lore-player-facing, etc.). "
        "In negotiation mode, suggest outline/brief changes in conversation — "
        "state-changing requests are handled via confirm cards in chat. "
        "Do not apply mutations directly in plan_patch for pipeline actions "
        "(draft outline, approve outline, export) — those go through the intent router. "
        "In review_halt mode, use resolve_ticket_ids when the user answers a blocker."
    )
    user = (
        f"Topic: {state.prompt}\nDomain: {state.domain}\n"
        f"Current brief: {json.dumps(brief)}\n"
        f"Agency settings: {json.dumps(state.agency_settings or {})}\n"
        f"Active voice: {state.active_style_pack}\n"
        f"Current outline: {json.dumps(state.outline or {})}\n"
        f"Open tickets: {[t.ticket_id for t in state.editorial_memo if not t.resolved]}\n"
        f"Active ticket: {state.active_ticket_id}\n"
        f"History:\n{hist_lines}\n\nUser: {user_text}"
    )

    try:
        response = await llm.ainvoke(
            [SystemMessage(content=system), HumanMessage(content=user)]
        )
        raw = extract_text(response.content).strip()
        raw = raw.lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(raw)
    except Exception as e:
        print(f"[consult_agent] LLM parse failed: {e}")
        return ConsultResult()

    result = ConsultResult(
        assistant_message=data.get("assistant_message"),
        plan_patch=data.get("plan_patch"),
    )
    if data.get("assistant_question"):
        result.assistant_question = data["assistant_question"]
    if data.get("intake_status"):
        result.intake_status = data["intake_status"]

    ticket_ids = data.get("resolve_ticket_ids") or []
    if ticket_ids:
        updated = []
        for t in state.editorial_memo:
            if t.ticket_id in ticket_ids and not t.resolved:
                updated.append(t.model_copy(update={"resolved": True}))
            else:
                updated.append(t)
        result.editorial_memo = updated

    return result


def _resolve_ticket_heuristic(state: NewsroomState, user_text: str) -> ConsultResult:
    text = user_text.lower()
    updated = []
    resolved_ids = []
    for t in state.editorial_memo:
        if t.resolved:
            updated.append(t)
            continue
        tid = t.ticket_id
        resolve = False
        if state.active_ticket_id and tid == state.active_ticket_id:
            resolve = len(user_text.strip()) > 2
        elif tid in ("ticket-b4", "ticket-b1"):
            resolve = any(
                w in text
                for w in ["rate limit", "deprecated", "archive", "resolve", "document", "endpoint", "api"]
            )
        elif tid == "ticket-contradiction":
            resolve = any(
                w in text
                for w in ["contradiction", "expires", "hours", "expiration", "24", "resolve"]
            )
        elif t.severity == "blocker":
            resolve = "resolve" in text or tid in text
        if resolve:
            updated.append(t.model_copy(update={"resolved": True}))
            resolved_ids.append(tid)
        else:
            updated.append(t)

    blockers = [t for t in updated if not t.resolved and t.severity == "blocker"]
    resume = len(resolved_ids) > 0 and len(blockers) == 0

    msg = "Thanks — I've noted that."
    if resolved_ids:
        msg = f"Resolved {len(resolved_ids)} ticket(s)."
    if blockers:
        msg += f" {len(blockers)} blocker(s) still open."

    return ConsultResult(
        assistant_message=msg,
        editorial_memo=updated,
        resume_pipeline=resume,
        ws_signal="resume_drafting" if resume else None,
        run_phase="review_halt" if not resume else "drafting",
    )


def _post_pipeline_consult(state: NewsroomState, user_text: str) -> ConsultResult:
    """After sign-off: export help, scope complaints — do not claim the pipeline is still running."""
    text = (user_text or "").lower()
    chapters = [k for k in (state.manuscript or {}) if k != "final_manuscript"]
    section_count = len((state.outline or {}).get("sections") or chapters)

    if any(w in text for w in ("export", "docx", "pdf", "download")):
        msg = (
            "Production is complete. Say **export docx** or **export pdf** in chat — "
            "I'll show a confirm card before exporting."
        )
    elif any(w in text for w in ("book", "longer", "long-form", "novel", "short", "article")):
        deliverable = (state.brief or {}).get("deliverable") or ""
        msg = (
            f"The signed-off draft has {section_count} section(s) in the current outline. "
        )
        if deliverable == "book" or "book" in (state.prompt or "").lower():
            msg += (
                "You asked for a book — to expand scope, open **Plan**, add chapters to the outline "
                "(or tell me here during **Plan** phase before you approve), then run **Draft outline** "
                "and **Approve outline** again for a longer manuscript."
            )
        else:
            msg += (
                "To treat this as a full book next time, say “book” during intake so we plan 8+ chapters, "
                "or add sections in **Plan** before approving the outline."
            )
    elif any(w in text for w in ("done", "finished", "complete", "stuck", "running", "wait")):
        msg = (
            "The pipeline has finished — you're in the **Done** phase. "
            "Edit chapters in the left nav, open **Preview**, or export from the sidebar/footer. "
            "I'm here for plan tweaks if you start a new planning pass."
        )
    else:
        msg = (
            "The manuscript is signed off. You can edit chapters, open Preview, or export DOCX/PDF. "
            "What would you like to change?"
        )

    _append_message(state, "assistant", msg)
    return ConsultResult(assistant_message=msg)


async def _negotiation_patch(state: NewsroomState, user_text: str) -> ConsultResult:
    llm_result = await _llm_consult(state, user_text, "negotiation")
    if llm_result.assistant_message:
        return ConsultResult(assistant_message=llm_result.assistant_message)

    return ConsultResult(
        assistant_message=(
            "Tell me what to change in the brief or outline — for example, "
            "“add a section on security” or “make the tone more formal.” "
            "I'll show a confirm card before applying changes."
        ),
    )


async def consult_turn(
    state: NewsroomState,
    user_text: str = "",
    action: Optional[str] = None,
    project_id: Optional[str] = None,
) -> ConsultResult:
    """Single lightweight consult turn; mutates state.conversation in place."""
    action = action or ""
    user_text = (user_text or "").strip()

    if action == "skip_question":
        state.pending_prompt = None
        return ConsultResult(
            assistant_message="Skipped. Share anything else, or ask to draft the outline when ready.",
            intake_status=state.intake_status,
        )

    if action == "resolve_ticket":
        ticket_id = user_text or state.active_ticket_id
        if ticket_id:
            state.active_ticket_id = ticket_id
        if not user_text and ticket_id:
            t = next((x for x in state.editorial_memo if x.ticket_id == ticket_id), None)
            if t:
                return ConsultResult(
                    assistant_question={
                        "question": t.description,
                        "choices": [],
                        "ticket_id": ticket_id,
                    },
                    assistant_message=t.suggested_fix or "How would you like to resolve this?",
                )

    if user_text:
        _append_message(state, "user", user_text, meta={"ticket_id": state.active_ticket_id})

    phase = state.run_phase or "intake"

    if phase in ("finished", "publishing"):
        return _post_pipeline_consult(state, user_text)

    if phase in BUSY_PHASES:
        if phase == "planning":
            reply = "Building your plan now — brief and outline coming up shortly."
        elif phase == "drafting":
            draft_keys = [k for k in (state.manuscript or {}) if k != "final_manuscript"]
            reply = (
                f"Drafting in progress — {len(draft_keys)} section(s) done so far. "
                "You can keep chatting; I'll update you as chapters land."
            )
        else:
            reply = (
                f"The agency is running ({phase}). Chapters update on the left as they're drafted. "
                "Ask me about progress or settings for the next pass."
            )
        _append_message(state, "assistant", reply)
        return ConsultResult(assistant_message=reply)

    if phase == "review_halt" or (
        phase in ("reviewing", "finished", "publishing")
        and any(not t.resolved for t in state.editorial_memo)
    ):
        llm_r = await _llm_consult(state, user_text, "review_halt")
        if llm_r.assistant_message or llm_r.editorial_memo:
            if llm_r.assistant_message:
                _append_message(state, "assistant", llm_r.assistant_message)
            blockers = [t for t in (llm_r.editorial_memo or state.editorial_memo) if not t.resolved and t.severity == "blocker"]
            if llm_r.editorial_memo and not blockers:
                llm_r.resume_pipeline = True
                llm_r.ws_signal = "resume_drafting"
            state.active_ticket_id = None
            return llm_r
        result = _resolve_ticket_heuristic(state, user_text)
        if result.assistant_message:
            _append_message(state, "assistant", result.assistant_message)
        state.active_ticket_id = None
        return result

    if phase == "negotiation" and (state.outline or {}).get("sections"):
        result = await _negotiation_patch(state, user_text)
        if result.assistant_message:
            _append_message(state, "assistant", result.assistant_message)
        state.consult_mode = "negotiation"
        state.pending_prompt = None
        if project_id and result.plan_patch:
            snap = state.dict()
            proj_store.merge_plan_in_state(
                snap,
                result.plan_patch.get("brief"),
                result.plan_patch.get("outline"),
                result.plan_patch.get("agency_settings"),
            )
            state.brief = snap.get("brief") or state.brief
            state.outline = snap.get("outline") or state.outline
            state.agency_settings = snap.get("agency_settings") or state.agency_settings
            if result.plan_patch.get("active_style_pack"):
                state.active_style_pack = result.plan_patch["active_style_pack"]
        return result

    # Intake / consult (default)
    state.consult_mode = "intake"
    state.run_phase = "intake"
    if state.intake_status == "not_started":
        state.intake_status = "in_progress"

    brief = _heuristic_intake_patch(state, user_text)
    llm_r = await _llm_consult(state, user_text or "Begin intake.", "intake")
    if llm_r.plan_patch:
        if llm_r.plan_patch.get("brief"):
            brief = {**brief, **llm_r.plan_patch["brief"]}
        if llm_r.plan_patch.get("agency_settings"):
            state.agency_settings = merge_agency_settings(
                state.agency_settings,
                llm_r.plan_patch["agency_settings"],
                state.domain,
            )
        if llm_r.plan_patch.get("active_style_pack"):
            state.active_style_pack = llm_r.plan_patch["active_style_pack"]
            brief["style_pack"] = state.active_style_pack
    state.brief = brief
    if state.target_audience and brief.get("audience"):
        state.target_audience = brief["audience"]

    turns = _user_turn_count(state)
    complete = _intake_complete(brief, turns, state) or llm_r.intake_status == "complete"

    if complete:
        state.intake_status = "complete"
        state.pending_prompt = None
        ag = state.agency_settings or {}
        summary = ""
        if ag.get("target_chapter_count"):
            summary += f" **{ag['target_chapter_count']} chapters**"
        if ag.get("target_word_count"):
            summary += f", **~{ag['target_word_count']:,} words**"
        if state.active_style_pack:
            summary += f", voice **{state.active_style_pack}**"
        msg = llm_r.assistant_message or (
            f"I have enough to draft an outline{summary or ''}. "
            "Click **Draft outline** when ready, or keep refining here."
        )
        _append_message(state, "assistant", msg)
        return ConsultResult(
            assistant_message=msg,
            plan_patch={
                "brief": brief,
                "agency_settings": state.agency_settings,
                "active_style_pack": state.active_style_pack,
            },
            intake_status="complete",
        )

    pending = _next_intake_question(brief, state.domain, state)
    if llm_r.assistant_question:
        aq = llm_r.assistant_question
        pending = PendingPrompt(
            field=aq.get("field"),
            question=aq.get("question", ""),
            choices=aq.get("choices") or [],
            ticket_id=aq.get("ticket_id"),
        )

    state.pending_prompt = pending
    msg = llm_r.assistant_message
    if not msg and pending:
        msg = pending.question
    elif not msg:
        msg = "Tell me more about what you're creating and who it's for."

    _append_message(state, "assistant", msg)

    result = ConsultResult(
        assistant_message=msg,
        plan_patch={
            "brief": brief,
            "agency_settings": state.agency_settings,
            "active_style_pack": state.active_style_pack,
        }
        if brief
        else None,
        intake_status=state.intake_status,
    )
    if pending:
        result.assistant_question = pending.dict()
        result.pending_prompt = pending.dict()
    return result


async def start_consult_session(state: NewsroomState, project_id: str) -> ConsultResult:
    """Opening turn after project create — heuristic only so the UI gets messages immediately."""
    state.run_phase = "intake"
    state.intake_status = "in_progress"
    state.consult_mode = "intake"
    state.brief = _brief_from_state(state)
    if not state.agency_settings:
        state.agency_settings = default_agency_settings(state.domain)
    if not state.active_style_pack:
        state.active_style_pack = default_style_pack_for_domain(state.domain)
        state.brief["style_pack"] = state.active_style_pack

    welcome = (
        f"Hi — I'm Scriptorium, your writing agent. Let's shape “{state.prompt}” together. "
        "Tell me what you're creating; I'll ask about audience, structure, and voice, "
        "then run the agency to draft it."
    )
    _append_message(state, "system", welcome)

    pending = _next_intake_question(state.brief, state.domain, state)
    state.pending_prompt = pending
    msg = pending.question if pending else (
        "Tell me who this is for and what success looks like when they're done reading."
    )
    _append_message(state, "assistant", msg)

    result = ConsultResult(
        assistant_message=msg,
        plan_patch={
            "brief": state.brief,
            "agency_settings": state.agency_settings,
            "active_style_pack": state.active_style_pack,
        },
        intake_status="in_progress",
    )
    if pending:
        result.assistant_question = pending.dict()
        result.pending_prompt = pending.dict()
    return result


def conversation_to_wire(state: NewsroomState) -> List[dict]:
    return [m.dict() for m in state.conversation]
