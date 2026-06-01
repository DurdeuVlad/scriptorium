# 🏛️ Scriptorium

**An AI-powered multi-agent editorial newsroom for long-form document production.**

Scriptorium orchestrates a full editorial pipeline — from brief to polished manuscript — using a team of specialized AI agents coordinated through a LangGraph state machine and served through a real-time React UI.

---

## ✨ What it does

You give Scriptorium a topic, a target audience, and a domain pack. It runs the document through a complete newsroom pipeline:

| Phase | Agent | Role |
|---|---|---|
| **Brief** | Commissioning Editor | Defines tone, goal, constraints |
| **Outline** | Outline Architect | Plans chapter structure |
| **Negotiate** | You | Review & approve the outline |
| **Draft** | Staff Writer | Writes all sections using RDF fact context |
| **Scrub** | Pattern Scrubber | Removes AI-stink, em-dashes, filler |
| **Copyedit** | Copyeditor | Checks voice, style, persona alignment |
| **Fact-check** | Fact-Checker | Audits claims against the RDF Fact Graph |
| **Compliance** | Compliance Officer | Checks against a separate Compliance RDF DB |
| **Creative** | Resonance Critic | Checks narrative pacing and emotional feel |
| **Gate** | Managing Editor | Signs off or sends back to drafting |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Scriptorium UI                      │
│              React + Vite  (port 5173)                  │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket
┌────────────────────▼────────────────────────────────────┐
│                   FastAPI Backend                        │
│                   app.py  (port 8000)                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              LangGraph Orchestrator                      │
│              orchestrator.py                            │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │ Semantic │  │Compliance │  │  LLM (Gemini/GPT/  │   │
│  │ RDF DB   │  │ RDF DB    │  │     Anthropic)     │   │
│  │(SQLite)  │  │(SQLite)   │  └────────────────────┘   │
│  └──────────┘  └───────────┘                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting started

### Prerequisites
- Python 3.11+
- Node 18+
- A Gemini / OpenAI / Anthropic API key

### Setup

```bash
# 1. Clone
git clone https://github.com/youruser/scriptorium.git
cd scriptorium

# 2. Python backend
pip install -r requirements.txt
cp .env.example .env   # add your API key

# 3. Frontend
cd frontend
npm install

# 4. Run both servers
# Terminal A:
python -m uvicorn app:app --reload

# Terminal B:
cd frontend && npm run dev
```

Open **http://localhost:5173** and commission your first document.

---

## 📁 Project structure

```
scriptorium/
├── app.py              # FastAPI + WebSocket server
├── orchestrator.py     # LangGraph agents & state machine
├── semantic_db.py      # SQLite-backed RDF fact store
├── compliance_db.py    # Separate compliance RDF database
├── mcp_client.py       # MCP tool integration
├── requirements.txt
├── .env
├── artifacts/          # Generated .md chapter files
├── db/                 # SQLite databases
└── frontend/           # Vite + React UI
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── index.css
    └── index.html
```

---

## 🔑 Environment variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Model name (default: `gemini-2.5-flash`) |
| `OPENAI_API_KEY` | OpenAI API key (alternative) |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative) |

---

## 🗺️ Roadmap

- [ ] Export to DOCX / PDF
- [ ] Redis caching layer between LLM calls
- [ ] Multi-document project management
- [ ] User accounts & run history
- [ ] Custom domain packs (Legal, Medical, Fiction)
- [ ] Inline outline negotiation via chat

---

*Scriptorium — where every word earns its place.*
