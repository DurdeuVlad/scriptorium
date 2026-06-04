import { useEffect, useRef } from "react";

import {
  getPhaseMeta,
  isExportingStatus,
  canGeneratePlan,
  isIntakeConsultPhase,
  isPipelineBusy,
} from "../lib/phases.js";

import ActionProposalCard from "./ActionProposalCard.jsx";
import AgencySettingsCard from "./AgencySettingsCard.jsx";
import VoicePicker from "./VoicePicker.jsx";
import ActivityRing from "./ui/ActivityRing.jsx";
import WaitingDots from "./ui/WaitingDots.jsx";

export default function MainAgentChat({
  phase,
  statusMessage,
  editorialMemo,
  messages,
  chatInput,
  onChatInputChange,
  onSendChat,
  onApproveOutline,
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
  consultInFlight = false,
  agencySettings,
  onAgencySettingsChange,
  activeStylePack,
  onStylePackChange,
  projectId,
  agencySettingsEditable,
  showDocumentPanel,
  onToggleDocumentPanel,
  onConfirmProposal,
  onCancelProposal,
  onEditProposal,
  pendingProposal,
}) {
  const chatEndRef = useRef(null);
  const meta = getPhaseMeta(phase);
  const openTickets = editorialMemo.filter((t) => !t.resolved);
  const resolvedTickets = editorialMemo.filter((t) => t.resolved);
  const busy = pipelineBusy ?? isPipelineBusy(phase);
  const composerBusy = busy || consultInFlight;
  const exporting = isExportingStatus(exportStatus);
  const inIntakeConsult = isIntakeConsultPhase(phase, intakeStatus);
  const showDraftOutline = canGeneratePlan(phase, intakeStatus);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingPrompt, pendingProposal]);

  return (
    <main className="main-agent-chat" id="main-agent-chat" aria-label="Scriptorium agent">
      <header className="main-agent-header">
        <div className="main-agent-title">
          <h2>Scriptorium</h2>
          <span className={`phase-badge tone-${meta.tone}`}>{meta.label}</span>
          {activeStylePack && (
            <span className="active-voice-badge">{activeStylePack}</span>
          )}
        </div>
        <div className="main-agent-header-actions">
          {onToggleDocumentPanel && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={onToggleDocumentPanel}
            >
              {showDocumentPanel ? "Hide document" : "Show document"}
            </button>
          )}
        </div>
      </header>

      <div className={`status-message main-agent-status${busy ? " is-busy" : ""}`}>
        {busy && <ActivityRing size="sm" label="Pipeline running" />}
        {statusMessage}
        {busy && <WaitingDots label="Pipeline in progress" />}
      </div>

      <section className="main-agent-messages">
        <div className="chat-messages">
          {messages.map((m, i) => {
            if (m.kind === "proposal" && m.proposal) {
              const isActive =
                m.proposal.status === "pending" &&
                pendingProposal?.proposal_id === m.proposal.proposal_id;
              return (
                <div key={i} className="chat-bubble proposal">
                  <ActionProposalCard
                    proposal={m.proposal}
                    disabled={!isActive}
                    onConfirm={onConfirmProposal}
                    onEdit={onEditProposal}
                    onCancel={onCancelProposal}
                  />
                </div>
              );
            }
            return (
              <div
                key={i}
                className={`chat-bubble ${(m.kind || m.sender).toLowerCase().replace(/\s+/g, "-")}`}
              >
                <strong>{m.sender === "Consultant" ? "Scriptorium" : m.sender}:</strong>{" "}
                {m.text}
              </div>
            );
          })}
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

        {(agencySettings || activeStylePack) && (
          <div className="main-agent-settings-row">
            <AgencySettingsCard
              agencySettings={agencySettings}
              editable={agencySettingsEditable}
              onChange={onAgencySettingsChange}
            />
            <VoicePicker
              projectId={projectId}
              activeVoice={activeStylePack}
              editable={agencySettingsEditable}
              onSelect={onStylePackChange}
            />
          </div>
        )}

        <div className="main-agent-action-chips">
          {showDraftOutline && (
            <button
              type="button"
              id="btn-draft-outline"
              className="btn-primary"
              disabled={busy}
              onClick={onGeneratePlan}
            >
              Draft outline
            </button>
          )}
          {showNegotiation && (
            <button
              type="button"
              id="btn-approve-outline"
              className="btn-primary"
              disabled={busy}
              onClick={onApproveOutline}
            >
              Start drafting
            </button>
          )}
          {showExport && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onSendChat?.("export docx")}
              >
                Export DOCX
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onSendChat?.("export pdf")}
              >
                Export PDF
              </button>
            </>
          )}
          {exportStatus && (
            <span className="export-status-inline">
              {exporting && <ActivityRing size="sm" label="Exporting" />}
              {exportStatus}
            </span>
          )}
        </div>

        {(openTickets.length > 0 || resolvedTickets.length > 0) && (
          <section className="ticket-list-inline">
            <h4>
              Open tickets
              {openTickets.length > 0 ? ` (${openTickets.length})` : ""}
            </h4>
            <ul>
              {openTickets.map((ticket) => (
                <li
                  key={ticket.ticket_id}
                  className="ticket-item unresolved"
                  data-severity={ticket.severity}
                >
                  <span className="ticket-badge">{ticket.issue_type.toUpperCase()}</span>
                  <strong>{ticket.section_id}</strong>: {ticket.description}
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
          </section>
        )}
      </section>

      <footer className="main-agent-composer">
        <input
          id="chat-input"
          type="text"
          placeholder={
            inIntakeConsult
              ? "Tell me what you're writing — audience, length, voice…"
              : "Message Scriptorium…"
          }
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendChat()}
          disabled={chatBlocked || composerBusy}
        />
        <button id="btn-send-chat" type="button" onClick={() => onSendChat()} disabled={chatBlocked || composerBusy}>
          Send
        </button>
      </footer>
    </main>
  );
}
