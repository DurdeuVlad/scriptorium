import { useEffect, useRef } from "react";

import {
  getPhaseMeta,
  isExportingStatus,
  canGeneratePlan,
  isIntakeConsultPhase,
  isPipelineBusy,
} from "../lib/phases.js";

import ActivityRing from "./ui/ActivityRing.jsx";
import WaitingDots from "./ui/WaitingDots.jsx";

export default function AssistantDrawer({
  expanded,
  onToggle,
  onCollapse,
  phase,
  statusMessage,
  editorialMemo,
  messages,
  chatInput,
  onChatInputChange,
  onSendChat,
  onApproveOutline,
  onExport,
  exportStatus,
  showNegotiation,
  showExport,
  intakeStatus,
  pendingPrompt,
  onConsultAction,
  onGeneratePlan,
  onAnswerTicket,
  pipelineBusy,
  chatBlocked = false,
}) {
  const chatEndRef = useRef(null);
  const meta = getPhaseMeta(phase);
  const openTickets = editorialMemo.filter((t) => !t.resolved);
  const resolvedTickets = editorialMemo.filter((t) => t.resolved);
  const busy = pipelineBusy ?? isPipelineBusy(phase);
  const exporting = isExportingStatus(exportStatus);
  const inIntakeConsult = isIntakeConsultPhase(phase, intakeStatus);
  const showDraftOutline = canGeneratePlan(phase, intakeStatus);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingPrompt]);

  if (!expanded) {
    return (
      <aside
        className="assistant-strip"
        id="assistant-drawer"
        aria-label="Assistant status"
      >
        <button
          type="button"
          className="assistant-strip-toggle"
          onClick={onToggle}
          title="Open assistant"
        >
          {busy && <ActivityRing size="sm" label="Pipeline running" />}
          <span className={`phase-badge tone-${meta.tone}`}>{meta.label}</span>
          <span className={`assistant-strip-status${busy ? " is-busy" : ""}`}>
            {statusMessage}
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="assistant-drawer open" id="assistant-drawer" aria-label="Assistant">
      <header className="assistant-drawer-header">
        <h3>Editorial desk</h3>
        <button type="button" className="btn-ghost" onClick={onCollapse} aria-label="Collapse assistant">
          ×
        </button>
      </header>

      <section className="assistant-section pipeline-monitor">
        <h4>Pipeline</h4>
        <div className={`status-message${busy ? " is-busy" : ""}`}>{statusMessage}</div>
        {busy && (
          <div className="pipeline-busy-indicator">
            <ActivityRing size="md" label="Pipeline running" />
            <WaitingDots label="Pipeline in progress" />
          </div>
        )}

        {showDraftOutline && (
          <div className="consult-actions">
            <button
              type="button"
              id="btn-draft-outline"
              className="btn-primary btn-block"
              disabled={busy}
              onClick={onGeneratePlan}
            >
              Draft outline
            </button>
            <p className="consult-actions-hint">
              {intakeStatus === "complete"
                ? "Ready when you are — generates brief sections and chapter outline."
                : "Continue the conversation, or draft when you have enough context."}
            </p>
          </div>
        )}

        {showNegotiation && (
          <div className="negotiation-controls">
            <button
              type="button"
              id="btn-approve-outline-drawer"
              className="btn-primary btn-block"
              disabled={busy}
              onClick={onApproveOutline}
            >
              Approve outline
            </button>
          </div>
        )}

        {showExport && (
          <div className="export-actions">
            <button type="button" className="btn-secondary btn-block" onClick={() => onExport("docx")}>
              Export DOCX
            </button>
            <button type="button" className="btn-secondary btn-block" onClick={() => onExport("pdf")}>
              Export PDF
            </button>
            {exportStatus && (
              <p className="export-status">
                {exporting && <ActivityRing size="sm" label="Exporting" />}
                {exportStatus}
              </p>
            )}
          </div>
        )}
      </section>

      {(openTickets.length > 0 || resolvedTickets.length > 0) && (
        <section className="assistant-section ticket-list">
          <h4>
            Tickets
            {openTickets.length > 0 ? ` (${openTickets.length} open)` : ""}
          </h4>
          {openTickets.length > 0 && (
            <ul>
              {openTickets.map((ticket) => (
                <li
                  key={ticket.ticket_id}
                  className="ticket-item unresolved"
                  data-severity={ticket.severity}
                >
                  <span className="ticket-badge">{ticket.issue_type.toUpperCase()}</span>
                  <strong>{ticket.section_id}</strong>: {ticket.description}
                  {ticket.suggested_fix && (
                    <div className="fix-suggestion">{ticket.suggested_fix}</div>
                  )}
                  {onAnswerTicket && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm ticket-answer-btn"
                      onClick={() => onAnswerTicket(ticket.ticket_id)}
                    >
                      Answer in chat
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {resolvedTickets.length > 0 && (
            <details className="ticket-resolved-group">
              <summary>Resolved ({resolvedTickets.length})</summary>
              <ul>
                {resolvedTickets.map((ticket) => (
                  <li
                    key={ticket.ticket_id}
                    className="ticket-item resolved"
                    data-severity={ticket.severity}
                  >
                    <span className="ticket-badge">{ticket.issue_type.toUpperCase()}</span>
                    <strong>{ticket.section_id}</strong>: {ticket.description}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      <section className="assistant-section chat-panel">
        <h4>Conversation</h4>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-bubble ${(m.kind || m.sender).toLowerCase().replace(/\s+/g, "-")}`}
            >
              <strong>{m.sender}:</strong> {m.text}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {pendingPrompt?.question && (
          <div className="consult-question-card">
            <p className="consult-question-text">{pendingPrompt.question}</p>
            {(pendingPrompt.choices || []).length > 0 && (
              <div className="consult-choice-row">
                {pendingPrompt.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className="btn-secondary btn-sm consult-choice-btn"
                    onClick={() => onConsultAction?.({ choice })}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="btn-link consult-skip-btn"
              onClick={() => onConsultAction?.({ action_id: "skip_question" })}
            >
              Skip this question
            </button>
          </div>
        )}

        <div className="chat-input-row">
          <input
            id="chat-input"
            type="text"
            placeholder={
              inIntakeConsult
                ? "Tell your story, ask questions…"
                : "Message the editorial desk…"
            }
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendChat()}
            disabled={
              chatBlocked ||
              (busy && phase !== "review_halt" && phase !== "negotiation")
            }
          />
          <button
            id="btn-send-chat"
            type="button"
            onClick={onSendChat}
            disabled={chatBlocked}
          >
            Send
          </button>
        </div>
      </section>
    </aside>
  );
}
