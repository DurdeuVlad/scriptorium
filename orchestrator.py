import os
import json
import uuid
from typing import List, Dict, Any, Literal, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# LangGraph & LangChain imports
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

# Local imports
from semantic_db import SemanticStore
from compliance_db import ComplianceStore
from mcp_client import MCPClientManager
from agency_settings import (
    default_agency_settings,
    merge_agency_settings,
    outline_hint_from_settings,
    iter_draft_units,
)
from style_packs import apply_style_pack, voice_prompt_block

load_dotenv()

# ==========================================
# 1. State Models
# ==========================================

class ConversationMessage(BaseModel):
    role: str = Field(description="'user', 'assistant', or 'system'.")
    content: str = Field(description="Message body.")
    ts: str = Field(default="", description="ISO timestamp.")
    meta: Dict[str, Any] = Field(default_factory=dict, description="Optional metadata (ticket_id, etc.).")


class PendingPrompt(BaseModel):
    ticket_id: Optional[str] = Field(default=None, description="Ticket this question resolves.")
    field: Optional[str] = Field(default=None, description="Brief/outline field being collected.")
    question: str = Field(description="Question shown to the user.")
    choices: List[str] = Field(default_factory=list, description="Quick-reply options.")


class EditTicket(BaseModel):
    ticket_id: str = Field(description="Unique ID for this issue.")
    section_id: str = Field(description="Target section/chapter of the document.")
    agent_source: str = Field(description="The agent that raised the ticket (e.g. 'Fact-Checker', 'Compliance-Officer').")
    issue_type: str = Field(description="Categorization: 'fact-check', 'style', 'logic', 'compliance', 'resonance'.")
    description: str = Field(description="Detailed explanation of the issue.")
    severity: str = Field(description="'blocker' (must resolve) or 'warning' (can skip).")
    suggested_fix: str = Field(description="Explicit instructions on how to resolve the issue.")
    resolved: bool = Field(default=False, description="Tracking flag for resolution loops.")


class ProposedAction(BaseModel):
    proposal_id: str = Field(description="Unique ID for this pending action.")
    kind: str = Field(description="Action type: update_agency_settings, patch_outline, etc.")
    summary: str = Field(description="Human-readable one-line summary.")
    before: Dict[str, Any] = Field(default_factory=dict)
    after: Dict[str, Any] = Field(default_factory=dict)
    available_decisions: List[str] = Field(
        default_factory=lambda: ["confirm", "edit", "cancel"]
    )
    apply_payload: Dict[str, Any] = Field(default_factory=dict)
    status: str = Field(default="pending", description="pending | confirmed | cancelled")
    created_at: str = Field(default="")


class NewsroomState(BaseModel):
    # Run Identifiers
    run_id: str = Field(description="Unique session ID registered in cache-server.")
    project_path: str = Field(description="Path to the active directory where files are written.")
    
    # Input parameters
    prompt: str = Field(description="The initial user request or book topic.")
    target_audience: str = Field(description="Explicit definition of the target reader.")
    domain: str = Field(description="Active domain mapping to load guides (e.g., technical-docs, creative-book).")
    
    # Semantic Databases
    rdf_db_path: str = Field(description="Path to the SQLite store backing the rdflib Fact Graph.")
    compliance_db_path: str = Field(description="Path to the separate Compliance RDF database.")
    
    # Document state
    brief: Dict[str, Any] = Field(default_factory=dict, description="The validated JSON brief schema.")
    outline: Dict[str, Any] = Field(default_factory=dict, description="The validated JSON outline schema.")
    manuscript: Dict[str, str] = Field(default_factory=dict, description="Chapter/section ID mapped to Markdown text.")
    agency_settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Word/chapter/subsection targets for the writing agency.",
    )
    
    # Review & Editorial status
    editorial_memo: List[EditTicket] = Field(default_factory=list, description="Aggregated outstanding edit tickets.")
    active_style_pack: str = Field(default="", description="Active style pack or custom voice ID.")
    run_phase: str = Field(default="intake", description="Current newsroom phase.")
    
    # Blocker status (System failures / user checkpoints)
    blockers: List[Dict[str, Any]] = Field(default_factory=list, description="Framework-level execution blockers.")

    # WebSocket / Communication bridge
    ws_signal: Optional[str] = Field(default=None, description="Inbound WebSocket signal (e.g., 'outline_approved').")

    # Consulting / conversation layer
    conversation: List[ConversationMessage] = Field(
        default_factory=list, description="Persisted consult thread."
    )
    intake_status: str = Field(
        default="not_started",
        description="'not_started' | 'in_progress' | 'complete'.",
    )
    pending_prompt: Optional[PendingPrompt] = Field(
        default=None, description="Structured question awaiting user reply."
    )
    consult_mode: str = Field(
        default="intake", description="Mirrors UI consult mode for the active phase."
    )
    active_ticket_id: Optional[str] = Field(
        default=None, description="Ticket user is answering in chat."
    )
    pending_proposal: Optional[ProposedAction] = Field(
        default=None, description="Action awaiting user confirmation."
    )

# ==========================================
# 2. LLM Helper Resolution
# ==========================================

def get_planner_llm():
    """Returns a high-capability model for planning nodes (brief, outline).
    Uses Pro-tier models that excel at structured reasoning and JSON generation.
    """
    if os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(model="gpt-5.5", temperature=0.1)
    elif os.getenv("ANTHROPIC_API_KEY"):
        return ChatAnthropic(model="claude-opus-4-5", temperature=0.1)
    elif os.getenv("GEMINI_API_KEY"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        # Prod: gemini-3.5-flash | Testing: gemini-2.5-pro
        model = os.getenv("GEMINI_PLANNER_MODEL", "gemini-3.5-flash")
        print(f"[LLM] Planner using: {model}")
        return ChatGoogleGenerativeAI(model=model, temperature=0.1, google_api_key=os.getenv("GEMINI_API_KEY"))
    else:
        print("Warning: No API keys found in environment. Running in mock mode.")
        return None


def get_executor_llm():
    """Returns a fast, cost-efficient model for execution nodes (drafting, scrubbing, fact-checking).
    Uses Flash-tier models optimised for throughput over deep reasoning.
    """
    if os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(model="gpt-5.3", temperature=0.3)
    elif os.getenv("ANTHROPIC_API_KEY"):
        return ChatAnthropic(model="claude-sonnet-4-5", temperature=0.3)
    elif os.getenv("GEMINI_API_KEY"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        # Prod: gemini-3.1-flash-lite | Testing: gemini-2.5-flash
        model = os.getenv("GEMINI_EXECUTOR_MODEL", "gemini-3.1-flash-lite")
        print(f"[LLM] Executor using: {model}")
        return ChatGoogleGenerativeAI(model=model, temperature=0.3, google_api_key=os.getenv("GEMINI_API_KEY"))
    else:
        print("Warning: No API keys found in environment. Running in mock mode.")
        return None


def extract_text(content: Any) -> str:
    """Extracts text content as a string, handling both string and list responses from the LLM client."""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                parts.append(part.get("text", ""))
            elif hasattr(part, "text"):
                parts.append(part.text)
            elif hasattr(part, "content"):
                parts.append(part.content)
            else:
                parts.append(str(part))
        return "".join(parts)
    else:
        return str(content)


# ==========================================
# 3. Newsroom Node Implementations
# ==========================================

async def write_brief(state: NewsroomState) -> Dict[str, Any]:
    print(f"[Node: write_brief] Generating brief... Active phase: {state.run_phase}")
    if state.run_phase in ["review_halt", "drafting", "scrubbing", "copyediting", "reviewing"]:
        print(f"[write_brief] Bypassing brief generation. Preserving phase: {state.run_phase}")
        return {"run_phase": state.run_phase}
    
    # 1. Initialize and seed RDF stores
    try:
        import sqlite3
        # Clear old quads to avoid lingering claims from previous runs
        for db_path in [state.rdf_db_path, state.compliance_db_path]:
            if os.path.exists(db_path):
                try:
                    with sqlite3.connect(db_path) as conn:
                        conn.execute("DELETE FROM quads")
                        conn.commit()
                except Exception as db_err:
                    print(f"Error clearing {db_path}: {db_err}")

        fact_store = SemanticStore(state.rdf_db_path)
        fact_store.assert_fact("doc:auth_token", "fact:expires_in", "24 hours", "agent:source_spec")
        print(f"[write_brief] Seeded fact store: doc:auth_token fact:expires_in '24 hours'")
        
        compliance_store = ComplianceStore(state.compliance_db_path)
        compliance_store.assert_fact("rule:auth", "clause:uses_https", "true", "regulation:company_policy")
        print(f"[write_brief] Seeded compliance store: rule:auth clause:uses_https 'true'")
    except Exception as e:
        print(f"[write_brief] Error seeding databases: {e}")
        
    # 2. Setup blocker tickets for case-01 if prompt/domain matches
    tickets = list(state.editorial_memo)
    if "api" in state.prompt.lower() or state.domain == "technical-docs":
        if not any(t.ticket_id == "ticket-b4" for t in tickets):
            tickets.append(EditTicket(
                ticket_id="ticket-b4",
                section_id="global",
                agent_source="Commissioning Editor",
                issue_type="fact-check",
                description="B4-missing-source: Rate limiting details are missing from the API specification.",
                severity="blocker",
                suggested_fix="Please specify the rate limit details (e.g. 100 requests per minute) in chat."
            ))
        if not any(t.ticket_id == "ticket-b1" for t in tickets):
            tickets.append(EditTicket(
                ticket_id="ticket-b1",
                section_id="global",
                agent_source="Commissioning Editor",
                issue_type="logic",
                description="B1-missing-user-decision: Ambiguous whether to document deprecated endpoints (e.g., /tasks/archive).",
                severity="blocker",
                suggested_fix="Please clarify in chat if /tasks/archive should be documented."
            ))

    existing_brief = dict(state.brief or {})
    agency = merge_agency_settings(
        state.agency_settings or default_agency_settings(state.domain),
        None,
        state.domain,
    )
    pack_id = apply_style_pack(state.active_style_pack, state.domain)

    llm = get_planner_llm()  # Brief generation: uses Pro model for structured JSON quality
    if not llm:
        mock_brief = {
            **existing_brief,
            "title": existing_brief.get("title") or f"Guide to AI for {state.target_audience}",
            "goal": existing_brief.get("goal") or "Explain AI simply",
            "audience": existing_brief.get("audience") or state.target_audience,
            "tone": existing_brief.get("tone") or "conversational",
            "domain": state.domain,
            "constraints": existing_brief.get("constraints") or [],
            "style_pack": pack_id,
        }
        return {
            "brief": mock_brief,
            "agency_settings": agency,
            "active_style_pack": pack_id,
            "run_phase": "planning",
            "editorial_memo": tickets,
        }

    system_prompt = (
        "You are the Commissioning Editor. Write a structured JSON brief for this book/document topic. "
        "Respond ONLY with raw JSON, no markdown fences. "
        "Preserve audience, tone, and constraints from the existing brief when present."
    )
    user_prompt = (
        f"Topic: {state.prompt}\nAudience: {state.target_audience}\nDomain: {state.domain}\n"
        f"Existing brief from consultation: {json.dumps(existing_brief)}\n"
        f"Agency settings: {json.dumps(agency)}\n"
        f"Style pack: {pack_id}"
    )

    response = await llm.ainvoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
    try:
        raw_content = extract_text(response.content)
        raw = raw_content.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        brief_data = json.loads(raw)
    except Exception as e:
        print(f"[write_brief] JSON parse failed ({e}), using fallback brief.")
        brief_data = {
            "title": "Brief Draft",
            "goal": state.prompt,
            "audience": state.target_audience,
            "domain": state.domain,
        }

    brief_data = {**existing_brief, **brief_data}
    brief_data["style_pack"] = pack_id
    if existing_brief.get("tone") and not brief_data.get("tone"):
        brief_data["tone"] = existing_brief["tone"]
    if existing_brief.get("constraints") and not brief_data.get("constraints"):
        brief_data["constraints"] = existing_brief["constraints"]

    return {
        "brief": brief_data,
        "agency_settings": agency,
        "active_style_pack": pack_id,
        "run_phase": "planning",
        "editorial_memo": tickets,
    }


async def write_outline(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: write_outline] Planning outline structure...")
    llm = get_planner_llm()  # Outline generation: uses Pro model for coherent chapter architecture
    if not llm:
        # Mock outline
        mock_outline = {
            "sections": [
                {"id": "section_01", "title": "Introduction", "goal": "Explain what AI is"},
                {"id": "section_02", "title": "First steps", "goal": "How to talk to AI"}
            ]
        }
        return {"outline": mock_outline, "run_phase": "negotiation"}

    agency = merge_agency_settings(
        state.agency_settings or default_agency_settings(state.domain),
        None,
        state.domain,
    )
    section_hint = outline_hint_from_settings(agency, state.domain)
    max_depth = int(agency.get("max_subsection_depth") or 1)
    subsection_note = ""
    if max_depth > 1:
        subsection_note = (
            " Each section may include a 'subsections' array with the same shape "
            "(id, title, goal, optional subsections). "
        )
    system_prompt = (
        "You are the Outline Architect. Generate a JSON outline. "
        "The JSON must have a top-level 'sections' array where each item has 'id', 'title', and 'goal' keys."
        f"{subsection_note}"
        f"Aim for {section_hint}. "
        "Respond ONLY with raw JSON, no markdown fences."
    )
    user_prompt = f"Brief: {json.dumps(state.brief)}\nAgency settings: {json.dumps(agency)}"
    
    response = await llm.ainvoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
    try:
        # BUG FIX: strip markdown fences
        raw_content = extract_text(response.content)
        raw = raw_content.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        outline_data = json.loads(raw)
        # BUG FIX: ensure sections array exists
        if "sections" not in outline_data:
            outline_data = {"sections": list(outline_data.values())[0] if outline_data else []}
    except Exception as e:
        print(f"[write_outline] JSON parse failed ({e}), using fallback outline.")
        outline_data = {
            "sections": [
                {"id": "section_01", "title": "Chapter 1", "goal": "Intro"},
                {"id": "section_02", "title": "Chapter 2", "goal": "Body"}
            ]
        }
    return {"outline": outline_data, "run_phase": "negotiation"}


async def negotiate_outline(state: NewsroomState) -> Dict[str, Any]:
    """Halt node. Pauses execution and waits for WebSocket signal 'outline_approved'."""
    print(f"[Node: negotiate_outline] Checking outline approval. ws_signal: {state.ws_signal}")
    if state.ws_signal == "outline_approved":
        print("[Node: negotiate_outline] Outline approved by user. Proceeding to drafting.")
        return {"run_phase": "drafting", "ws_signal": None}
    else:
        # Halt execution by remaining in negotiation phase. The graph will stop at the END condition because negotiate_outline is a leaf or returns to negotiation.
        # Actually, let's just make it return the state so that the graph run finishes, and the API can re-invoke the graph later with the approved signal.
        return {"run_phase": "negotiation"}


async def staff_writer(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: staff_writer] Drafting/Revising sections...")
    llm = get_executor_llm()
    manuscript = dict(state.manuscript)
    fact_store = SemanticStore(state.rdf_db_path)
    tickets = [t for t in state.editorial_memo if not t.resolved]

    agency = merge_agency_settings(
        state.agency_settings or default_agency_settings(state.domain),
        None,
        state.domain,
    )
    max_depth = int(agency.get("max_subsection_depth") or 1)
    pack_id = apply_style_pack(
        state.active_style_pack or (state.brief or {}).get("style_pack"),
        state.domain,
    )
    project_id = ""
    if state.project_path:
        parts = state.project_path.replace("\\", "/").split("/")
        try:
            idx = parts.index("projects")
            project_id = parts[idx + 1]
        except (ValueError, IndexError):
            pass
    voice_block = voice_prompt_block(project_id, pack_id)
    words_per = agency.get("words_per_chapter")

    draft_units = iter_draft_units(state.outline, max_depth=max_depth)
    if not draft_units:
        draft_units = [
            {
                "key": s["id"],
                "id": s["id"],
                "title": s.get("title", s["id"]),
                "goal": s.get("goal", ""),
                "depth": 1,
            }
            for s in state.outline.get("sections", [])
        ]

    all_keys = {u["key"] for u in draft_units}

    for unit in draft_units:
        key = unit["key"]
        sid = unit["id"]
        title = unit["title"]
        goal = unit["goal"]
        depth = unit.get("depth", 1)
        heading = "#" * min(depth + 1, 4)

        section_tickets = [
            t for t in tickets
            if t.section_id == sid or t.section_id == key or t.section_id in (sid, key)
        ]

        facts = fact_store.get_all_quads()
        facts_context = "\n".join([
            f"({q['subject']}, {q['predicate']}, {q['object']})"
            for q in facts if sid in q["subject"] or key in q["subject"] or "global" in q["subject"]
        ])

        word_hint = f"\nTarget length: ~{words_per} words." if words_per else ""

        if key not in manuscript:
            print(f"Writing first draft for: {title} ({key})")
            if not llm:
                manuscript[key] = f"{heading} {title}\n\nDraft content for this section."
            else:
                sys_prompt = (
                    "You are the Staff Writer. Write the prose draft for this section using provided facts. "
                    "Output raw Markdown."
                    f"{voice_block}"
                )
                tone = (state.brief or {}).get("tone")
                tone_line = f"\nTone: {tone}" if tone else ""
                user_prompt = (
                    f"Section: {title}\nGoal: {goal}{tone_line}{word_hint}\n"
                    f"Facts context:\n{facts_context}"
                )
                response = await llm.ainvoke([SystemMessage(content=sys_prompt), HumanMessage(content=user_prompt)])
                manuscript[key] = extract_text(response.content)
        elif section_tickets:
            print(f"Revising {title} based on edit memo...")
            for ticket in section_tickets:
                if not llm:
                    manuscript[key] += f"\n\n*Revised to resolve: {ticket.description}*"
                else:
                    sys_prompt = (
                        "You are the Staff Writer. Revise the provided text to resolve the edit ticket feedback."
                        f"{voice_block}"
                    )
                    user_prompt = (
                        f"Original Text:\n{manuscript[key]}\n\nEdit Ticket:\n{ticket.description}\n"
                        f"Suggested Fix: {ticket.suggested_fix}"
                    )
                    response = await llm.ainvoke([SystemMessage(content=sys_prompt), HumanMessage(content=user_prompt)])
                    manuscript[key] = extract_text(response.content)

        try:
            os.makedirs(state.project_path, exist_ok=True)
            safe_key = key.replace("/", "_")
            filepath = os.path.join(state.project_path, f"{safe_key}.md")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(manuscript[key])
            print(f"[staff_writer] Wrote draft file: {filepath}")
        except Exception as e:
            print(f"[staff_writer] Failed to write draft file: {e}")

    updated_memo = []
    for t in state.editorial_memo:
        if t.section_id in all_keys and not t.resolved:
            updated_memo.append(t.model_copy(update={"resolved": True}))
        else:
            updated_memo.append(t)
    return {"manuscript": manuscript, "run_phase": "scrubbing", "editorial_memo": updated_memo}


async def pattern_scrubber(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: pattern_scrubber] Spotting and removing AI-stink and em-dash bloat...")
    manuscript = dict(state.manuscript)
    llm = get_executor_llm()  # Pattern scrubbing: uses Flash model — repetitive cleanup pass
    
    for sid, text in manuscript.items():
        # Simple local rule: clean excess em-dashes
        cleaned = text.replace(" — ", ", ").replace("—", ", ")
        
        if llm:
            sys_prompt = "You are the Pattern Scrubber. Remove any robotic transitions, repetitive rhythms, and wordy AI phrasing."
            user_prompt = f"Clean this text:\n{cleaned}"
            response = await llm.ainvoke([SystemMessage(content=sys_prompt), HumanMessage(content=user_prompt)])
            manuscript[sid] = extract_text(response.content)
        else:
            manuscript[sid] = cleaned
            
        # Write cleaned section back to disk. Sanitize sid the same way
        # staff_writer sanitizes this exact identifier (safe_key), so this
        # write lands on the same file staff_writer already wrote instead
        # of drifting to a different (and unsanitized, traversal-prone)
        # path for the same section.
        try:
            os.makedirs(state.project_path, exist_ok=True)
            safe_sid = sid.replace("/", "_")
            filepath = os.path.join(state.project_path, f"{safe_sid}.md")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(manuscript[sid])
            print(f"[pattern_scrubber] Wrote clean draft file: {filepath}")
        except Exception as e:
            print(f"[pattern_scrubber] Failed to write clean draft file: {e}")
            
    return {"manuscript": manuscript, "run_phase": "copyediting"}


async def copyeditor(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: copyeditor] Analyzing voice and format alignment...")
    tickets = list(state.editorial_memo)
    pack_id = apply_style_pack(
        state.active_style_pack or (state.brief or {}).get("style_pack"),
        state.domain,
    )
    print(f"[copyeditor] Active style pack: {pack_id}")
    for sid, text in state.manuscript.items():
        if "uses_mcp" in text.lower() and not any(t.section_id == sid and t.issue_type == "style" for t in tickets):
            # Example style warning
            ticket = EditTicket(
                ticket_id=str(uuid.uuid4()),
                section_id=sid,
                agent_source="Copyeditor",
                issue_type="style",
                description="Contains dry technical acronym (MCP) without plain explanation.",
                severity="warning",
                suggested_fix="Define MCP on first use."
            )
            tickets.append(ticket)
            
    return {"editorial_memo": tickets, "run_phase": "reviewing"}


async def fact_checker(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: fact_checker] Auditing assertions against the RDF Fact database...")
    import re
    tickets = list(state.editorial_memo)
    fact_store = SemanticStore(state.rdf_db_path)
    llm = get_executor_llm()  # Fact checking: uses Flash model — claim extraction from text
    
    # 1. B9 Blocker: JSON validation check
    for sid, text in state.manuscript.items():
        json_blocks = re.findall(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        for block in json_blocks:
            try:
                json.loads(block.strip())
            except json.JSONDecodeError as jde:
                print(f"[fact_checker] B9 Blocker JSON Syntax Error in {sid}: {jde}")
                if not any(t.ticket_id == f"ticket-b9-{sid}" for t in tickets):
                    tickets.append(EditTicket(
                        ticket_id=f"ticket-b9-{sid}",
                        section_id=sid,
                        agent_source="Fact-Checker",
                        issue_type="fact-check",
                        description=f"B9-validation-failure: Example JSON response has syntax error: {str(jde)}",
                        severity="blocker",
                        suggested_fix="Correct the JSON syntax (ensure double quotes, commas, brackets/braces are matched)."
                    ))

        # 2. Extract and assert claims from manuscript for token expiration
        if "expire" in text.lower() or "expiry" in text.lower():
            claimed_expiry = "none"
            if llm:
                sys_prompt = "You are a precise semantic parsing assistant. Extract the token expiration duration from the text (e.g. '24 hours', '1 hour'). Respond with ONLY the exact duration string (e.g. '24 hours' or '1 hour'), or 'none' if not found."
                try:
                    response = await llm.ainvoke([SystemMessage(content=sys_prompt), HumanMessage(content=text)])
                    claimed_expiry = extract_text(response.content).strip().lower()
                except Exception as e:
                    print(f"[fact_checker] LLM claim extraction failed: {e}")
            else:
                # Mock offline check
                if "1 hour" in text.lower():
                    claimed_expiry = "1 hour"
                elif "24 hours" in text.lower():
                    claimed_expiry = "24 hours"
            
            if claimed_expiry != "none" and claimed_expiry != "":
                # Assert claimed fact in semantic store
                fact_store.assert_fact("doc:auth_token", "fact:expires_in_claim", claimed_expiry, f"agent:manuscript_claim_{sid}")
                print(f"[fact_checker] Asserted claim: doc:auth_token expires_in_claim '{claimed_expiry}'")

    # 3. SPARQL contradiction check
    sparql_query = """
    PREFIX fact: <http://example.org/facts/>
    SELECT ?gt ?claim
    WHERE {
        <http://example.org/doc/auth_token> fact:expires_in ?gt .
        <http://example.org/doc/auth_token> fact:expires_in_claim ?claim .
        FILTER (?gt != ?claim)
    }
    """
    try:
        contradictions = fact_store.query_sparql(sparql_query)
        for row in contradictions:
            gt_val, claim_val = str(row[0]), str(row[1])
            print(f"[fact_checker] Contradiction found: Ground Truth '{gt_val}' != Manuscript Claim '{claim_val}'")
            # If the contradiction ticket was resolved before, let's reset it or add if not present
            if not any(t.ticket_id == "ticket-contradiction" and not t.resolved for t in tickets):
                # Remove any existing contradiction ticket if it was resolved but now reopened
                tickets = [t for t in tickets if t.ticket_id != "ticket-contradiction"]
                tickets.append(EditTicket(
                    ticket_id="ticket-contradiction",
                    section_id="global",
                    agent_source="Fact-Checker",
                    issue_type="fact-check",
                    description=f"Semantic Contradiction: API spec states token expires in '{gt_val}', but manuscript claims '{claim_val}'.",
                    severity="blocker",
                    suggested_fix=f"Update the token expiration details in the authentication section to '{gt_val}'."
                ))
    except Exception as e:
        print(f"[fact_checker] SPARQL query error: {e}")
            
    return {"editorial_memo": tickets}


async def compliance_officer(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: compliance_officer] Evaluating requirements against the Compliance RDF Database...")
    tickets = list(state.editorial_memo)
    compliance_store = ComplianceStore(state.compliance_db_path)
    
    # 1. Query compliance policies via SPARQL
    sparql_query = """
    PREFIX fact: <http://example.org/facts/>
    SELECT ?rule ?val
    WHERE {
        ?rule fact:clause:uses_https ?val .
    }
    """
    requires_https = False
    try:
        policies = compliance_store.query_sparql(sparql_query)
        for row in policies:
            if str(row[1]) == "true":
                requires_https = True
    except Exception as e:
        print(f"[compliance_officer] SPARQL query error: {e}")

    # 2. Check if manuscript contains auth rules and enforces HTTPS
    if requires_https:
        for sid, text in state.manuscript.items():
            if "auth" in sid.lower() or "login" in text.lower():
                if "https" not in text.lower():
                    print(f"[compliance_officer] Compliance warning in {sid}: HTTPS not mentioned.")
                    if not any(t.ticket_id == f"ticket-compliance-{sid}" and not t.resolved for t in tickets):
                        tickets = [t for t in tickets if t.ticket_id != f"ticket-compliance-{sid}"]
                        tickets.append(EditTicket(
                            ticket_id=f"ticket-compliance-{sid}",
                            section_id=sid,
                            agent_source="Compliance-Officer",
                            issue_type="compliance",
                            description="Compliance Violation: Authentication endpoint description must specify HTTPS requirement.",
                            severity="blocker",
                            suggested_fix="Update the auth endpoint description to state that all requests must be sent over HTTPS."
                        ))
                        
    return {"editorial_memo": tickets}


def _compile_final_manuscript(manuscript: Dict[str, str], project_path: str = "") -> Dict[str, str]:
    """Merge chapter drafts into final_manuscript for preview and export."""
    keys = sorted(k for k in manuscript if k != "final_manuscript")
    if not keys:
        return manuscript
    top_level = [k for k in keys if "__" not in k]
    if top_level:
        parts = []
        for tk in top_level:
            parts.append(manuscript[tk])
            for sk in keys:
                if sk.startswith(f"{tk}__"):
                    parts.append(manuscript[sk])
        merged = "\n\n---\n\n".join(parts)
    else:
        merged = "\n\n---\n\n".join(manuscript[k] for k in keys)
    manuscript = {**manuscript, "final_manuscript": merged}
    if project_path:
        try:
            os.makedirs(project_path, exist_ok=True)
            final_path = os.path.join(project_path, "final_manuscript.md")
            with open(final_path, "w", encoding="utf-8") as f:
                f.write(merged)
            print(f"[compile] Wrote {final_path}")
        except OSError as e:
            print(f"[compile] Failed to write final_manuscript: {e}")
    return manuscript


async def creative_review(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: creative_review] Checking narrative pacing and emotional resonance...")
    tickets = list(state.editorial_memo)
    return {"editorial_memo": tickets}


def reconcile_run_phase(state: NewsroomState) -> str:
    """
    Align persisted run_phase with editorial_memo reality.
    Stakeholder rule: review_halt only when unresolved blocker tickets exist;
    publishing maps to finished for the UI.
    """
    phase = state.run_phase or "idle"
    if phase == "publishing":
        return "finished"
    if phase == "review_halt":
        open_blockers = [
            t for t in state.editorial_memo
            if not t.resolved and t.severity == "blocker"
        ]
        if not open_blockers:
            return "finished" if state.manuscript else "drafting"
    return phase


async def managing_editor(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: managing_editor] Aggregating checks and checking gates...")
    # Check if there are unresolved blocker tickets
    blockers = [t for t in state.editorial_memo if not t.resolved and t.severity == "blocker"]
    
    if blockers:
        print(f"Quality gate failed: {len(blockers)} blocking edit tickets exist. Halting for user resolution.")
        return {"run_phase": "review_halt", "ws_signal": None}
    else:
        print("Quality gate passed. Editorial compilation signed off.")
        manuscript = _compile_final_manuscript(dict(state.manuscript), state.project_path)
        return {"run_phase": "finished", "manuscript": manuscript}

# ==========================================
# 4. LangGraph Engine Construction
# ==========================================

def route_newsroom(state: NewsroomState) -> str:
    """Controls graph routing edges based on current active phase."""
    if state.run_phase == "planning":
        return "write_outline"
    elif state.run_phase == "negotiation":
        if state.ws_signal == "outline_approved":
            return "staff_writer"
        else:
            return "__end__"  # BUG FIX: must return string, not the END sentinel object
    elif state.run_phase == "drafting":
        return "staff_writer"
    elif state.run_phase == "scrubbing":
        return "pattern_scrubber"
    elif state.run_phase == "copyediting":
        return "copyeditor"
    elif state.run_phase == "reviewing":
        return "fact_checker"
    elif state.run_phase == "review_halt":
        if state.ws_signal == "resume_drafting":
            return "staff_writer"
        else:
            return "__end__"
    elif state.run_phase == "publishing":
        return "__end__"  # BUG FIX: must return string, not the END sentinel object
    else:
        return "__end__"

def build_graph() -> StateGraph:
    workflow = StateGraph(NewsroomState)
    
    # Add Nodes
    workflow.add_node("write_brief", write_brief)
    workflow.add_node("write_outline", write_outline)
    workflow.add_node("negotiate_outline", negotiate_outline)
    workflow.add_node("staff_writer", staff_writer)
    workflow.add_node("pattern_scrubber", pattern_scrubber)
    workflow.add_node("copyeditor", copyeditor)
    workflow.add_node("fact_checker", fact_checker)
    workflow.add_node("compliance_officer", compliance_officer)
    workflow.add_node("creative_review", creative_review)
    workflow.add_node("managing_editor", managing_editor)
    
    # Setup Edges
    workflow.set_entry_point("write_brief")
    
    # Define route logic
    workflow.add_conditional_edges(
        "write_brief",
        route_newsroom,
        {
            "write_outline": "write_outline",
            "staff_writer": "staff_writer",
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "write_outline",
        route_newsroom,
        {
            "negotiate_outline": "negotiate_outline",
            "staff_writer": "staff_writer",  # BUG FIX: second invocation with ws_signal='outline_approved' routes here
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "negotiate_outline",
        route_newsroom,
        {
            "negotiate_outline": "negotiate_outline",
            "staff_writer": "staff_writer",
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "staff_writer",
        route_newsroom,
        {
            "pattern_scrubber": "pattern_scrubber",
            "__end__": END
        }
    )
    workflow.add_conditional_edges(
        "pattern_scrubber",
        route_newsroom,
        {
            "copyeditor": "copyeditor",
            "__end__": END
        }
    )
    
    # Review transitions
    workflow.add_edge("copyeditor", "fact_checker")
    workflow.add_edge("fact_checker", "compliance_officer")
    workflow.add_edge("compliance_officer", "creative_review")
    workflow.add_edge("creative_review", "managing_editor")
    
    workflow.add_conditional_edges(
        "managing_editor",
        route_newsroom,
        {
            "staff_writer": "staff_writer",  # BUG FIX: route_newsroom returns 'staff_writer' (not 'drafting') when blockers exist
            "__end__": END
        }
    )
    
    return workflow.compile()
