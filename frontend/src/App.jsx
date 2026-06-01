import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";

// Phase → emoji dot for project list badges
const PHASE_DOT = {
  idle:        { dot: "⬜", label: "idle" },
  intake:      { dot: "🟡", label: "intake" },
  planning:    { dot: "🟡", label: "planning" },
  negotiation: { dot: "🟠", label: "negotiation" },
  drafting:    { dot: "🔵", label: "drafting" },
  scrubbing:   { dot: "🔵", label: "scrubbing" },
  copyediting: { dot: "🔵", label: "editing" },
  reviewing:   { dot: "🔵", label: "reviewing" },
  review_halt: { dot: "🔴", label: "halted" },
  publishing:  { dot: "🟢", label: "done" },
  finished:    { dot: "🟢", label: "done" },
};

function phaseDot(phase) {
  return (PHASE_DOT[phase] || PHASE_DOT.idle).dot;
}
function phaseLabel(phase) {
  return (PHASE_DOT[phase] || PHASE_DOT.idle).label;
}

function App() {
  // ── Project management ────────────────────────────────────────────────────
  const [projects, setProjects]               = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showNewForm, setShowNewForm]         = useState(false);
  const activeProjectIdRef                    = useRef(null);

  // ── New-project form fields ───────────────────────────────────────────────
  const [prompt,   setPrompt]   = useState("Write a technical API reference guide for the Task Tracking REST API");
  const [audience, setAudience] = useState("Software developers integrating with the task management platform");
  const [domain,   setDomain]   = useState("technical-docs");

  // ── Pipeline state ────────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState("idle");
  const [statusMessage, setStatusMessage] = useState("Select a project or create a new one.");

  // ── Document state ────────────────────────────────────────────────────────
  const [brief,          setBrief]          = useState(null);
  const [outline,        setOutline]        = useState(null);
  const [manuscript,     setManuscript]     = useState({});
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [editorContent,  setEditorContent]  = useState("");
  const [editorialMemo,  setEditorialMemo]  = useState([]);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [messages,   setMessages]   = useState([
    { sender: "system", text: "Welcome to Scriptorium — your AI-powered editorial newsroom." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  const ws = useRef(null);

  // Keep ref in sync so the WS closure always sees the latest project id
  useEffect(() => { activeProjectIdRef.current = activeProjectId; }, [activeProjectId]);

  // Auto-scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── API helpers ───────────────────────────────────────────────────────────

  const fetchProjects = async () => {
    try {
      const res  = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      setProjects(data);
      return data;
    } catch (e) {
      console.error("fetchProjects failed:", e);
      return [];
    }
  };

  const loadProject = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`);
      if (!res.ok) return;
      const project = await res.json();
      const snap    = project.state || {};

      // Normalise manuscript keys (strip .md suffix if present)
      const normalised = {};
      Object.entries(snap.manuscript || {}).forEach(([k, v]) => {
        normalised[k.replace(/\.md$/, "")] = v;
      });

      setActiveProjectId(projectId);
      activeProjectIdRef.current = projectId;
      localStorage.setItem("scriptorium_active_project", projectId);

      setPhase(project.phase || "idle");
      setManuscript(normalised);
      setEditorialMemo(snap.editorial_memo || []);
      setBrief(snap.brief   || null);
      setOutline(snap.outline || null);
      setSelectedFile(null);
      setEditorContent("");
      // Restore form fields so the user sees what this project was about
      setPrompt(project.prompt);
      setAudience(project.audience);
      setDomain(project.domain);

      // Restore chat from localStorage
      const savedChat = localStorage.getItem(`scriptorium_chat_${projectId}`);
      setMessages(
        savedChat
          ? JSON.parse(savedChat)
          : [{ sender: "system", text: `Project "${project.name}" loaded.` }]
      );

      const label = phaseLabel(project.phase);
      setStatusMessage(`"${project.name}" — ${label}`);
    } catch (e) {
      console.error("loadProject failed:", e);
    }
  };

  // On mount: load project list, restore last active project
  useEffect(() => {
    fetchProjects().then((list) => {
      const lastId = localStorage.getItem("scriptorium_active_project");
      if (lastId && list.find((p) => p.id === lastId)) {
        loadProject(lastId);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist chat whenever it changes (keyed by project)
  useEffect(() => {
    if (activeProjectId && messages.length > 0) {
      localStorage.setItem(
        `scriptorium_chat_${activeProjectId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, activeProjectId]);

  // ── WebSocket ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws");
    ws.current = socket;

    socket.onopen  = () => console.log("[WS] connected");
    socket.onclose = () => console.log("[WS] disconnected");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[WS]", data.type, data);

      switch (data.type) {
        case "status_update":
          setPhase(data.phase);
          setStatusMessage(data.message);
          setMessages((prev) => [...prev, { sender: "Managing Editor", text: data.message }]);
          break;

        case "outline_proposal":
          setBrief(data.brief);
          setOutline(data.outline);
          setPhase("negotiation");
          setStatusMessage("Outline proposed. Review and approve to begin drafting.");
          setMessages((prev) => [
            ...prev,
            { sender: "System", text: "Outline proposed. You can now negotiate or approve it." },
          ]);
          break;

        case "file_update": {
          // Only apply updates for the currently active project
          const pid = data.project_id;
          if (!pid || pid === activeProjectIdRef.current) {
            const key = data.filename.replace(/\.md$/, "");
            setManuscript((prev) => ({ ...prev, [key]: data.content }));
          }
          break;
        }

        case "run_complete": {
          // Normalise keys
          const normalised = {};
          Object.entries(data.manuscript || {}).forEach(([k, v]) => {
            normalised[k.replace(/\.md$/, "")] = v;
          });
          setManuscript(normalised);
          setEditorialMemo(data.editorial_memo || []);
          setPhase(data.phase);
          setStatusMessage("Document production complete!");
          setMessages((prev) => [
            ...prev,
            { sender: "Managing Editor", text: "Document signed off and exported successfully!" },
          ]);
          // Refresh project list so phase badges update
          fetchProjects();
          break;
        }

        case "error":
          setStatusMessage(`Error: ${data.message}`);
          setPhase("idle");
          setMessages((prev) => [
            ...prev,
            { sender: "System", text: `Error: ${data.message}` },
          ]);
          break;

        default:
          break;
      }
    };

    return () => socket.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Project actions ───────────────────────────────────────────────────────

  const handleCreateProject = async () => {
    if (!prompt.trim()) return;
    try {
      // 1. Register project in backend (creates directory tree)
      const res     = await fetch(`${API_BASE}/projects`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt, audience, domain }),
      });
      const project = await res.json();

      // 2. Reset UI for this new project
      setProjects((prev) => [project, ...prev]);
      setActiveProjectId(project.id);
      activeProjectIdRef.current = project.id;
      localStorage.setItem("scriptorium_active_project", project.id);

      setManuscript({});
      setBrief(null);
      setOutline(null);
      setEditorialMemo([]);
      setSelectedFile(null);
      setPhase("intake");
      setShowNewForm(false);

      const initChat = [{ sender: "system", text: `New project "${project.name}" commissioned.` }];
      setMessages(initChat);
      localStorage.setItem(`scriptorium_chat_${project.id}`, JSON.stringify(initChat));

      // 3. Kick off the pipeline via WebSocket
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type:            "start_run",
          project_id:      project.id,
          prompt,
          target_audience: audience,
          domain,
        }));
      }
    } catch (e) {
      console.error("handleCreateProject failed:", e);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project and all its files? This cannot be undone.")) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
        activeProjectIdRef.current = null;
        localStorage.removeItem("scriptorium_active_project");
        setManuscript({});
        setEditorialMemo([]);
        setBrief(null);
        setOutline(null);
        setPhase("idle");
        setStatusMessage("Select a project or create a new one.");
        setMessages([{ sender: "system", text: "Welcome to Scriptorium." }]);
      }
    } catch (e) {
      console.error("handleDeleteProject failed:", e);
    }
  };

  // ── Pipeline actions ──────────────────────────────────────────────────────

  const handleApproveOutline = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "approve_outline" }));
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { sender: "User", text: chatInput }]);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "chat_message", text: chatInput }));
    }
    setChatInput("");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const chapterKeys = Object.keys(manuscript).filter((k) => k !== "final_manuscript");

  return (
    <div className="newsroom-app">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-brand">
          <span className="icon">🏛️</span>
          <h1>Scriptorium</h1>
        </div>
        <div className="status-badge" data-phase={phase}>
          Phase: {phase.toUpperCase()}
        </div>
      </header>

      {/* ── Three-pane layout ────────────────────────────────────────────── */}
      <div className="workspace-panes">

        {/* ── Left Pane ─────────────────────────────────────────────────── */}
        <aside className="pane pane-left">

          {/* Projects panel */}
          <div className="projects-panel">
            <div className="pane-header projects-header">
              <h3>Projects</h3>
              <button
                id="btn-new-project"
                className="btn-new-project"
                onClick={() => setShowNewForm((v) => !v)}
                title={showNewForm ? "Cancel" : "New project"}
              >
                {showNewForm ? "✕ Cancel" : "+ New"}
              </button>
            </div>

            {/* New project inline form */}
            {showNewForm && (
              <div className="new-project-form">
                <label>Prompt / Topic:</label>
                <textarea
                  id="new-project-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe the document you want to create…"
                />
                <label>Target Audience:</label>
                <input
                  id="new-project-audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Who is this for?"
                />
                <label>Domain Pack:</label>
                <select
                  id="new-project-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="technical-docs">Technical Docs (clear-teacher)</option>
                  <option value="creative-book">Creative Book (resonance-critic)</option>
                </select>
                <button
                  id="btn-commission-project"
                  className="btn-primary"
                  onClick={handleCreateProject}
                >
                  Commission ➤
                </button>
              </div>
            )}

            {/* Project list */}
            <ul className="project-list">
              {projects.length === 0 && !showNewForm && (
                <li className="empty-state" style={{ listStyle: "none" }}>
                  No projects yet. Click <strong>+ New</strong> to start.
                </li>
              )}
              {projects.map((p) => (
                <li
                  key={p.id}
                  className={`project-item${activeProjectId === p.id ? " active" : ""}`}
                  onClick={() => loadProject(p.id)}
                  title={p.prompt}
                >
                  <span className="project-dot">{phaseDot(p.phase)}</span>
                  <div className="project-meta">
                    <span className="project-name">{p.name}</span>
                    <span className="project-sub">
                      {phaseLabel(p.phase)} · {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="btn-delete-project"
                    onClick={(e) => handleDeleteProject(e, p.id)}
                    title="Delete project"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Chapter file list */}
          <div className="file-list">
            <h4>Generated Chapters</h4>
            {chapterKeys.length === 0 ? (
              <div className="empty-state">No chapters generated yet.</div>
            ) : (
              <ul>
                {chapterKeys.map((key) => (
                  <li
                    key={key}
                    className={selectedFile === key ? "active" : ""}
                    onClick={() => {
                      setSelectedFile(key);
                      setEditorContent(manuscript[key]);
                    }}
                  >
                    📝 {key}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Middle Pane ───────────────────────────────────────────────── */}
        <main className="pane pane-middle">
          <div className="pane-header">
            <h3>Active Document: {selectedFile || "None Selected"}</h3>
          </div>
          <div className="editor-container">
            {selectedFile ? (
              <textarea
                className="markdown-editor"
                value={editorContent}
                onChange={(e) => {
                  setEditorContent(e.target.value);
                  setManuscript((prev) => ({ ...prev, [selectedFile]: e.target.value }));
                }}
              />
            ) : (
              <div className="editor-placeholder">
                <span className="placeholder-icon">✍️</span>
                <p>Select a chapter from the Left Pane or start a new run to generate drafts.</p>
              </div>
            )}
          </div>
        </main>

        {/* ── Right Pane ────────────────────────────────────────────────── */}
        <aside className="pane pane-right">
          <div className="pane-header">
            <h3>Co-Pilot &amp; Reviewers</h3>
          </div>

          {/* Pipeline monitor */}
          <div className="pipeline-monitor">
            <h4>Execution Pipeline</h4>
            <div className="status-message">{statusMessage}</div>
            {phase === "negotiation" && (
              <div className="negotiation-controls">
                <p className="highlight-text">
                  Outline proposed! Verify the chapter structure and click Approve.
                </p>
                <button
                  id="btn-approve-outline"
                  className="btn-success"
                  onClick={handleApproveOutline}
                >
                  Approve &amp; Execute Outline
                </button>
              </div>
            )}
          </div>

          {/* Editorial tickets */}
          <div className="ticket-list">
            <h4>
              Active Editorial Tickets ({editorialMemo.filter((t) => !t.resolved).length})
            </h4>
            {editorialMemo.length === 0 ? (
              <div className="empty-state">No quality tickets raised yet.</div>
            ) : (
              <ul>
                {editorialMemo.map((ticket) => (
                  <li
                    key={ticket.ticket_id}
                    className={`ticket-item ${ticket.resolved ? "resolved" : "unresolved"}`}
                    data-severity={ticket.severity}
                  >
                    <span className="ticket-badge">{ticket.issue_type.toUpperCase()}</span>
                    <strong>{ticket.section_id}</strong>: {ticket.description}
                    <div className="fix-suggestion">💡 {ticket.suggested_fix}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chat panel */}
          <div className="chat-panel">
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`chat-bubble ${m.sender.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <strong>{m.sender}:</strong> {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input
                id="chat-input"
                type="text"
                placeholder="Ask editor to rewrite section..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button id="btn-send-chat" onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default App;
