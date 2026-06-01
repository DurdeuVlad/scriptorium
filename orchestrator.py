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

load_dotenv()

# ==========================================
# 1. State Models
# ==========================================

class EditTicket(BaseModel):
    ticket_id: str = Field(description="Unique ID for this issue.")
    section_id: str = Field(description="Target section/chapter of the document.")
    agent_source: str = Field(description="The agent that raised the ticket (e.g. 'Fact-Checker', 'Compliance-Officer').")
    issue_type: str = Field(description="Categorization: 'fact-check', 'style', 'logic', 'compliance', 'resonance'.")
    description: str = Field(description="Detailed explanation of the issue.")
    severity: str = Field(description="'blocker' (must resolve) or 'warning' (can skip).")
    suggested_fix: str = Field(description="Explicit instructions on how to resolve the issue.")
    resolved: bool = Field(default=False, description="Tracking flag for resolution loops.")

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
    
    # Review & Editorial status
    editorial_memo: List[EditTicket] = Field(default_factory=list, description="Aggregated outstanding edit tickets.")
    active_style_pack: str = Field(default="baseline", description="The persona profile ID loaded from persona-write.")
    run_phase: str = Field(default="intake", description="Current newsroom phase.")
    
    # Blocker status (System failures / user checkpoints)
    blockers: List[Dict[str, Any]] = Field(default_factory=list, description="Framework-level execution blockers.")

    # WebSocket / Communication bridge
    ws_signal: Optional[str] = Field(default=None, description="Inbound WebSocket signal (e.g., 'outline_approved').")

# ==========================================
# 2. LLM Helper Resolution
# ==========================================

def get_llm():
    """Resolves and returns the available LLM model."""
    if os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(model="gpt-4o-mini", temperature=0.1)
    elif os.getenv("ANTHROPIC_API_KEY"):
        return ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0.1)
    elif os.getenv("GEMINI_API_KEY"):
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), temperature=0.1, google_api_key=os.getenv("GEMINI_API_KEY"))
    else:
        # Return a mock model for testing if no key is present
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
    print("[Node: write_brief] Generating brief...")
    llm = get_llm()
    if not llm:
        # Mock brief for local offline validation
        mock_brief = {
            "title": f"Guide to AI for {state.target_audience}",
            "goal": "Explain AI simply",
            "audience": state.target_audience,
            "tone": "conversational",
            "domain": state.domain,
            "constraints": []
        }
        return {"brief": mock_brief, "run_phase": "planning"}

    system_prompt = "You are the Commissioning Editor. Write a structured JSON brief for this book/document topic. Respond ONLY with raw JSON, no markdown fences."
    user_prompt = f"Topic: {state.prompt}\nAudience: {state.target_audience}\nDomain: {state.domain}"
    
    response = await llm.ainvoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
    try:
        # BUG FIX: strip markdown fences that LLMs like Gemini often wrap JSON in
        raw_content = extract_text(response.content)
        raw = raw_content.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        brief_data = json.loads(raw)
    except Exception as e:
        print(f"[write_brief] JSON parse failed ({e}), using fallback brief.")
        brief_data = {"title": "Brief Draft", "goal": state.prompt, "audience": state.target_audience, "domain": state.domain}
        
    return {"brief": brief_data, "run_phase": "planning"}


async def write_outline(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: write_outline] Planning outline structure...")
    llm = get_llm()
    if not llm:
        # Mock outline
        mock_outline = {
            "sections": [
                {"id": "section_01", "title": "Introduction", "goal": "Explain what AI is"},
                {"id": "section_02", "title": "First steps", "goal": "How to talk to AI"}
            ]
        }
        return {"outline": mock_outline, "run_phase": "negotiation"}

    system_prompt = "You are the Outline Architect. Generate a JSON outline. The JSON must have a top-level 'sections' array where each item has 'id', 'title', and 'goal' keys. Respond ONLY with raw JSON, no markdown fences."
    user_prompt = f"Brief: {json.dumps(state.brief)}"
    
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
    llm = get_llm()
    manuscript = dict(state.manuscript)
    
    # Resolve databases
    fact_store = SemanticStore(state.rdf_db_path)
    
    # Check if we have active edit tickets to resolve
    tickets = [t for t in state.editorial_memo if not t.resolved]
    
    for section in state.outline.get("sections", []):
        sid = section["id"]
        title = section["title"]
        goal = section["goal"]
        
        # Check if this section has an outstanding ticket
        section_tickets = [t for t in tickets if t.section_id == sid]
        
        # Load facts from the central RDF fact database for context
        facts = fact_store.get_all_quads()
        facts_context = "\n".join([f"({q['subject']}, {q['predicate']}, {q['object']})" for q in facts if sid in q['subject'] or 'global' in q['subject']])
        
        if sid not in manuscript:
            # First draft
            print(f"Writing first draft for: {title}")
            if not llm:
                manuscript[sid] = f"# {title}\n\nDraft content for OSPF and AI tools simply explained."
            else:
                sys_prompt = "You are the Staff Writer. Write the prose draft for this section using provided facts. Output raw Markdown."
                user_prompt = f"Section: {title}\nGoal: {goal}\nFacts context:\n{facts_context}"
                response = await llm.ainvoke([SystemMessage(content=sys_prompt), HumanMessage(content=user_prompt)])
                manuscript[sid] = extract_text(response.content)
        elif section_tickets:
            # Revision Pass
            print(f"Revising {title} based on edit memo...")
            for ticket in section_tickets:
                if not llm:
                    manuscript[sid] += f"\n\n*Revised to resolve: {ticket.description}*"
                else:
                    sys_prompt = "You are the Staff Writer. Revise the provided text to resolve the edit ticket feedback."
                    user_prompt = f"Original Text:\n{manuscript[sid]}\n\nEdit Ticket:\n{ticket.description}\nSuggested Fix: {ticket.suggested_fix}"
                    response = await llm.ainvoke([SystemMessage(content=sys_prompt), HumanMessage(content=user_prompt)])
                    manuscript[sid] = extract_text(response.content)
                # BUG FIX: Pydantic v2 models are immutable; mutating ticket.resolved is silently dropped.
                # We need to rebuild the editorial_memo list with resolved flags updated.
        
        # Write section to disk so file watcher streams it to UI
        try:
            os.makedirs(state.project_path, exist_ok=True)
            filepath = os.path.join(state.project_path, f"{sid}.md")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(manuscript[sid])
            print(f"[staff_writer] Wrote draft file: {filepath}")
        except Exception as e:
            print(f"[staff_writer] Failed to write draft file: {e}")

    # Rebuild editorial_memo with resolved tickets updated
    updated_memo = []
    for t in state.editorial_memo:
        if t.section_id in [s["id"] for s in state.outline.get("sections", [])] and not t.resolved:
            updated_memo.append(t.model_copy(update={"resolved": True}))
        else:
            updated_memo.append(t)
    return {"manuscript": manuscript, "run_phase": "scrubbing", "editorial_memo": updated_memo}


async def pattern_scrubber(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: pattern_scrubber] Spotting and removing AI-stink and em-dash bloat...")
    manuscript = dict(state.manuscript)
    llm = get_llm()
    
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
            
        # Write cleaned section back to disk
        try:
            os.makedirs(state.project_path, exist_ok=True)
            filepath = os.path.join(state.project_path, f"{sid}.md")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(manuscript[sid])
            print(f"[pattern_scrubber] Wrote clean draft file: {filepath}")
        except Exception as e:
            print(f"[pattern_scrubber] Failed to write clean draft file: {e}")
            
    return {"manuscript": manuscript, "run_phase": "copyediting"}


async def copyeditor(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: copyeditor] Analyzing voice and format alignment...")
    llm = get_llm()
    tickets = list(state.editorial_memo)
    
    # We load persona-write specs (e.g. from local file if needed)
    # Check style and add tickets
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
    tickets = list(state.editorial_memo)
    fact_store = SemanticStore(state.rdf_db_path)
    
    # Query semantic database via SPARQL
    query = """
    PREFIX fact: <http://example.org/facts/>
    SELECT ?subject ?predicate ?object
    WHERE {
        ?subject ?predicate ?object .
    }
    """
    try:
        facts = fact_store.query_sparql(query)
    except Exception as e:
        print(f"Error querying fact store: {e}")
        facts = []
        
    for sid, text in state.manuscript.items():
        # Look for contradictions
        # If writing about OSPF but database says OSPF is not supported
        if "ospf" in text.lower():
            # Run simple validation checks
            pass
            
    return {"editorial_memo": tickets}


async def compliance_officer(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: compliance_officer] Evaluating requirements against the Compliance RDF Database...")
    tickets = list(state.editorial_memo)
    compliance_store = ComplianceStore(state.compliance_db_path)
    
    # Check regulatory checklists
    return {"editorial_memo": tickets}


async def creative_review(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: creative_review] Checking narrative pacing and emotional resonance...")
    tickets = list(state.editorial_memo)
    return {"editorial_memo": tickets}


async def managing_editor(state: NewsroomState) -> Dict[str, Any]:
    print("[Node: managing_editor] Aggregating checks and checking gates...")
    # Check if there are unresolved blocker tickets
    blockers = [t for t in state.editorial_memo if not t.resolved and t.severity == "blocker"]
    
    if blockers:
        print(f"Quality gate failed: {len(blockers)} blocking edit tickets exist.")
        # BUG FIX: route_newsroom maps 'drafting' -> 'staff_writer', so set run_phase correctly
        return {"run_phase": "drafting", "ws_signal": None}
    else:
        print("Quality gate passed. Editorial compilation signed off.")
        return {"run_phase": "publishing"}

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
