import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("Write a short guide about how to use AI for complete beginners");
  const [audience, setAudience] = useState("non-technical elderly people");
  const [domain, setDomain] = useState("technical-docs");
  
  // Pipeline state
  const [runId, setRunId] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle, intake, planning, negotiation, drafting, copyediting, reviewing, publishing, finished
  const [statusMessage, setStatusMessage] = useState("Scriptorium ready. Commission a new document run.");
  
  // Document state
  const [brief, setBrief] = useState(null);
  const [outline, setOutline] = useState(null);
  const [manuscript, setManuscript] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorialMemo, setEditorialMemo] = useState([]);
  
  // Chat log
  const [messages, setMessages] = useState([
    { sender: "system", text: "Welcome to Scriptorium — your AI-powered editorial newsroom." }
  ]);
  const [chatInput, setChatInput] = useState("");

  const ws = useRef(null);

  useEffect(() => {
    // Establish WebSocket connection
    const socket = new WebSocket("ws://localhost:8000/ws");
    ws.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected to FastAPI");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message:", data);

      if (data.type === "status_update") {
        setPhase(data.phase);
        setStatusMessage(data.message);
        setMessages((prev) => [...prev, { sender: "Managing Editor", text: data.message }]);
      } else if (data.type === "outline_proposal") {
        setBrief(data.brief);
        setOutline(data.outline);
        // BUG FIX: always force phase to 'negotiation' so the Approve button renders,
        // regardless of what run_phase the server echoes back
        setPhase("negotiation");
        setStatusMessage("Outline proposed. Please review and negotiate or approve.");
        setMessages((prev) => [...prev, { sender: "System", text: "Outline proposed. You can now negotiate or approve it." }]);
      } else if (data.type === "file_update") {
        setManuscript((prev) => ({
          ...prev,
          [data.filename]: data.content
        }));
        if (selectedFile === data.filename) {
          setEditorContent(data.content);
        }
      } else if (data.type === "run_complete") {
        setManuscript(data.manuscript);
        setEditorialMemo(data.editorial_memo || []);
        setPhase(data.phase);
        setStatusMessage("Document production complete!");
        setMessages((prev) => [...prev, { sender: "Managing Editor", text: "Document signed off and exported successfully!" }]);
      } else if (data.type === "error") {
        setStatusMessage(`Error: ${data.message}`);
        setPhase("idle");
        setMessages((prev) => [...prev, { sender: "System", text: `Error occurred: ${data.message}` }]);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, []); // WS created once; avoid reconnect on selectedFile change

  const handleStartRun = () => {
    if (ws.current) {
      setManuscript({});
      setBrief(null);
      setOutline(null);
      setEditorialMemo([]);
      setPhase("intake");
      ws.current.send(JSON.stringify({
        type: "start_run",
        prompt,
        target_audience: audience,
        domain
      }));
    }
  };

  const handleApproveOutline = () => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: "approve_outline" }));
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { sender: "User", text: chatInput }]);
    setChatInput("");
    // Negotiating via chat can send outline parameter changes or prompts
  };

  return (
    <div className="newsroom-app">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="icon">🏛️</span>
          <h1>Scriptorium</h1>
        </div>
        <div className="status-badge" data-phase={phase}>
          Phase: {phase.toUpperCase()}
        </div>
      </header>

      {/* Main 3-Pane Layout */}
      <div className="workspace-panes">
        
        {/* Left Pane: Project Browser */}
        <aside className="pane pane-left">
          <div className="pane-header">
            <h3>Workspace Files</h3>
          </div>
          
          <div className="intake-form">
            <label>Prompt / Topic:</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={phase !== "idle"} />
            
            <label>Target Audience:</label>
            <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} disabled={phase !== "idle"} />
            
            <label>Domain Pack:</label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} disabled={phase !== "idle"}>
              <option value="technical-docs">Technical Docs (clear-teacher)</option>
              <option value="creative-book">Creative Book (resonance-critic)</option>
            </select>

            {phase === "idle" && (
              <button className="btn-primary" onClick={handleStartRun}>Commission Project</button>
            )}
          </div>

          <div className="file-list">
            <h4>Generated Chapters</h4>
            {Object.keys(manuscript).length === 0 ? (
              <div className="empty-state">No manuscript files generated yet.</div>
            ) : (
              <ul>
                {Object.keys(manuscript).map((filename) => (
                  <li 
                    key={filename} 
                    className={selectedFile === filename ? "active" : ""}
                    onClick={() => {
                      setSelectedFile(filename);
                      setEditorContent(manuscript[filename]);
                    }}
                  >
                    📝 {filename}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Middle Pane: Markdown Editor */}
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
                  setManuscript(prev => ({ ...prev, [selectedFile]: e.target.value }));
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

        {/* Right Pane: AI Chat & Pipeline Monitor */}
        <aside className="pane pane-right">
          <div className="pane-header">
            <h3>Co-Pilot & Reviewers</h3>
          </div>

          <div className="pipeline-monitor">
            <h4>Execution Pipeline</h4>
            <div className="status-message">{statusMessage}</div>
            {phase === "negotiation" && (
              <div className="negotiation-controls">
                <p className="highlight-text">Outline proposed! Verify the chapter structures and click Approve.</p>
                <button className="btn-success" onClick={handleApproveOutline}>Approve & Execute Outline</button>
              </div>
            )}
          </div>

          {/* Edit Tickets list */}
          <div className="ticket-list">
            <h4>Active Editorial Tickets ({editorialMemo.filter(t => !t.resolved).length})</h4>
            {editorialMemo.length === 0 ? (
              <div className="empty-state">No quality tickets raised yet.</div>
            ) : (
              <ul>
                {editorialMemo.map((ticket) => (
                  <li key={ticket.ticket_id} className={`ticket-item ${ticket.resolved ? "resolved" : "unresolved"}`} data-severity={ticket.severity}>
                    <span className="ticket-badge">{ticket.issue_type.toUpperCase()}</span>
                    <strong>{ticket.section_id}</strong>: {ticket.description}
                    <div className="fix-suggestion">💡 {ticket.suggested_fix}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.sender.toLowerCase().replace(" ", "-")}`}>
                  <strong>{m.sender}:</strong> {m.text}
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <input 
                type="text" 
                placeholder="Ask editor to rewrite section..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default App;
