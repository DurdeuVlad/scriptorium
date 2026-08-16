import { useCallback, useEffect, useRef, useState } from "react";
import { resolveWsUrl } from "../config.js";
import { getPhaseMeta } from "../lib/phases.js";

function wireToMessages(conversation) {
  if (!Array.isArray(conversation)) return [];
  return conversation.map((m) => ({
    sender:
      m.role === "user"
        ? "You"
        : m.role === "assistant"
          ? "Scriptorium"
          : "System",
    text: m.content,
    kind: m.role === "assistant" ? "consult" : m.role === "user" ? "user" : "system",
  }));
}

function appendPendingProposalMessage(messages, pendingProposal) {
  if (!pendingProposal) return messages;
  const exists = messages.some(
    (m) =>
      m.kind === "proposal" &&
      m.proposal?.proposal_id === pendingProposal.proposal_id
  );
  if (exists) return messages;
  return [
    ...messages,
    {
      sender: "System",
      text: "",
      kind: "proposal",
      proposal: pendingProposal,
    },
  ];
}

function mergeConversationSync(prev, data) {
  const wired = wireToMessages(data.conversation);
  const wiredUserTexts = new Set(
    wired.filter((m) => m.kind === "user").map((m) => m.text)
  );
  const optimisticUsers = prev.filter(
    (m) => m.kind === "user" && !wiredUserTexts.has(m.text)
  );
  const resolvedProposals = prev.filter(
    (m) => m.kind === "proposal" && m.proposal?.status !== "pending"
  );
  const pendingFromSync =
    data.pending_proposal ??
    prev.find((m) => m.kind === "proposal" && m.proposal?.status === "pending")
      ?.proposal ??
    null;
  const merged = [...wired, ...optimisticUsers];
  for (const resolved of resolvedProposals) {
    const id = resolved.proposal?.proposal_id;
    if (
      id &&
      !merged.some(
        (m) => m.kind === "proposal" && m.proposal?.proposal_id === id
      )
    ) {
      merged.push(resolved);
    }
  }
  return appendPendingProposalMessage(merged, pendingFromSync);
}

function withProjectId(payload, projectId) {
  if (!projectId) return payload;
  return { ...payload, project_id: projectId };
}

export function usePipeline({
  activeProjectIdRef,
  activeProjectId,
  onOutlineProposal,
  onPlanPatch,
  onFileUpdate,
  onRunComplete,
  onEditorialMemoSync,
  onProjectsRefresh,
  onExportRequested,
  onOpenPlanEditor,
  selectedFile,
  setSelectedFile,
  setEditorContent,
}) {
  const [phase, setPhase] = useState("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Select a project or create a new one."
  );
  const [messages, setMessages] = useState([
    {
      sender: "System",
      text: "Welcome to Scriptorium — your AI-powered editorial newsroom.",
      kind: "system",
    },
  ]);
  const [intakeStatus, setIntakeStatus] = useState("not_started");
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [pendingProposal, setPendingProposal] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [bindPending, setBindPending] = useState(false);
  const [consultInFlight, setConsultInFlight] = useState(false);

  const ws = useRef(null);
  const wsReady = useRef(false);
  const pendingBind = useRef(null);
  const pendingOutbound = useRef([]);
  const lastConsultSendAt = useRef(0);

  const flushPending = useCallback(() => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    if (pendingBind.current) {
      ws.current.send(
        JSON.stringify({
          type: "bind_project",
          project_id: pendingBind.current,
        })
      );
      pendingBind.current = null;
    }
    const queue = pendingOutbound.current;
    pendingOutbound.current = [];
    for (const payload of queue) {
      ws.current.send(JSON.stringify(payload));
    }
  }, []);

  const send = useCallback((payload) => {
    const pid = activeProjectIdRef.current;
    const enriched = withProjectId(payload, pid);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(enriched));
      return;
    }
    pendingOutbound.current.push(enriched);
  }, [activeProjectIdRef]);

  useEffect(() => {
    const socket = new WebSocket(resolveWsUrl());
    ws.current = socket;

    socket.onopen = () => {
      console.log("[WS] connected");
      wsReady.current = true;
      flushPending();
    };
    socket.onclose = () => {
      console.log("[WS] disconnected");
      wsReady.current = false;
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const activeId = activeProjectIdRef.current;

      switch (data.type) {
        case "status_update":
          setPhase(data.phase);
          setStatusMessage(data.message);
          break;

        case "assistant_message":
          setConsultInFlight(false);
          setMessages((prev) => [
            ...prev,
            { sender: "Scriptorium", text: data.text, kind: "consult" },
          ]);
          if (data.phase) setPhase(data.phase);
          break;

        case "assistant_question":
          setConsultInFlight(false);
          setPendingPrompt({
            question: data.question,
            choices: data.choices || [],
            field: data.field,
            ticket_id: data.ticket_id,
          });
          if (data.question) {
            setMessages((prev) => [
              ...prev,
              { sender: "Scriptorium", text: data.question, kind: "consult" },
            ]);
          }
          if (data.phase) setPhase(data.phase);
          break;

        case "plan_patch":
          if (onPlanPatch) {
            onPlanPatch({
              brief: data.brief,
              outline: data.outline,
              agency_settings: data.agency_settings,
              active_style_pack: data.active_style_pack,
            });
          }
          if (data.phase) setPhase(data.phase);
          break;

        case "intake_status":
          setIntakeStatus(data.status);
          if (data.phase) setPhase(data.phase);
          break;

        case "proposed_action": {
          if (data.project_id && activeId && data.project_id !== activeId) {
            break;
          }
          setConsultInFlight(false);
          setPendingProposal(data.proposal || null);
          setMessages((prev) => {
            const next = [...prev];
            if (data.assistant_message) {
              next.push({
                sender: "Scriptorium",
                text: data.assistant_message,
                kind: "consult",
              });
            }
            if (data.proposal) {
              next.push({
                sender: "System",
                text: "",
                kind: "proposal",
                proposal: data.proposal,
              });
            }
            return next;
          });
          if (data.phase) setPhase(data.phase);
          break;
        }

        case "proposal_resolved": {
          if (data.project_id && activeId && data.project_id !== activeId) {
            break;
          }
          setPendingProposal(null);
          setMessages((prev) =>
            prev.map((m) =>
              m.kind === "proposal" &&
              m.proposal?.proposal_id === data.proposal_id
                ? {
                    ...m,
                    proposal: { ...m.proposal, status: data.status },
                  }
                : m
            )
          );
          break;
        }

        case "export_requested": {
          if (data.project_id && activeId && data.project_id !== activeId) {
            break;
          }
          onExportRequested?.(data.format || "docx");
          break;
        }

        case "open_plan_editor": {
          if (data.project_id && activeId && data.project_id !== activeId) {
            break;
          }
          onOpenPlanEditor?.();
          break;
        }

        case "conversation_sync": {
          if (data.project_id && activeId && data.project_id !== activeId) {
            break;
          }
          setBindPending(false);
          setConsultInFlight(false);
          setMessages((prev) => mergeConversationSync(prev, data));
          setPhase(data.phase || "idle");
          setIntakeStatus(data.intake_status || "not_started");
          setPendingPrompt(data.pending_prompt || null);
          setPendingProposal(data.pending_proposal ?? null);
          if (data.brief || data.outline || data.agency_settings) {
            onPlanPatch?.({
              brief: data.brief,
              outline: data.outline,
              agency_settings: data.agency_settings,
              active_style_pack: data.active_style_pack,
            });
          }
          if (data.editorial_memo) {
            onEditorialMemoSync?.(data.editorial_memo);
          }
          break;
        }

        case "editorial_memo_sync": {
          if (data.project_id && activeId && data.project_id !== activeId) {
            break;
          }
          setConsultInFlight(false);
          onEditorialMemoSync?.(data.editorial_memo || []);
          if (data.phase) setPhase(data.phase);
          break;
        }

        case "outline_proposal":
          setConsultInFlight(false);
          onOutlineProposal(data);
          setPhase(data.phase || "negotiation");
          setIntakeStatus("complete");
          setStatusMessage("Outline proposed. Review in the document panel, then approve in chat.");
          setMessages((prev) => [
            ...prev,
            {
              sender: "System",
              text: "Outline ready. Review the plan panel, edit structure if needed, then approve.",
              kind: "system",
            },
          ]);
          break;

        case "file_update": {
          const pid = data.project_id;
          if (!pid || pid === activeId) {
            onFileUpdate(data, selectedFile, setEditorContent);
          }
          break;
        }

        case "run_complete":
          setConsultInFlight(false);
          onRunComplete(data);
          setPhase(data.phase === "publishing" ? "finished" : data.phase);
          setStatusMessage("Document production complete!");
          setMessages((prev) => [
            ...prev,
            {
              sender: "System",
              text: "Document signed off. Open chapters or export from the sidebar.",
              kind: "system",
            },
          ]);
          onProjectsRefresh();
          break;

        case "error":
          setConsultInFlight(false);
          setHasError(true);
          setStatusMessage(`Error: ${data.message}`);
          setMessages((prev) => [
            ...prev,
            { sender: "System", text: `Error: ${data.message}`, kind: "system" },
          ]);
          break;

        default:
          break;
      }
    };

    return () => socket.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bindProject = useCallback(
    (projectId) => {
      if (!projectId) return;
      setBindPending(true);
      pendingBind.current = projectId;
      flushPending();
    },
    [flushPending]
  );

  const startConsult = useCallback(
    (projectId, prompt, targetAudience, domain) => {
      send({
        type: "start_consult",
        project_id: projectId,
        prompt,
        target_audience: targetAudience || "",
        domain,
      });
      setPhase("intake");
      setIntakeStatus("in_progress");
      setStatusMessage("Consult with your editorial desk…");
    },
    [send]
  );

  const startRun = useCallback(
    (projectId, prompt, targetAudience, domain) => {
      send({
        type: "start_run",
        project_id: projectId,
        prompt,
        target_audience: targetAudience,
        domain,
      });
      setIntakeStatus("complete");
    },
    [send]
  );

  const generatePlan = useCallback(() => {
    send({ type: "consult_action", action_id: "generate_plan" });
    setPendingPrompt(null);
  }, [send]);

  const approveOutline = useCallback(() => {
    send({ type: "approve_outline" });
  }, [send]);

  const sendConsult = useCallback(
    (text, extra = {}) => {
      const trimmed = text?.trim();
      if (!trimmed && !extra.action_id && !extra.choice) return;
      if (bindPending) {
        return;
      }

      lastConsultSendAt.current = Date.now();

      if (trimmed) {
        setMessages((prev) => [
          ...prev,
          { sender: "You", text: trimmed, kind: "user" },
        ]);
      }
      setConsultInFlight(true);
      send({
        type: extra.action_id ? "consult_action" : "consult_message",
        text: trimmed || "",
        action_id: extra.action_id,
        choice: extra.choice,
        ticket_id: extra.ticket_id,
      });
      if (extra.choice || extra.action_id) {
        setPendingPrompt(null);
      }
    },
    [send, bindPending]
  );

  const confirmProposal = useCallback(
    (proposalId) => {
      send({
        type: "consult_action",
        action_id: "confirm_proposal",
        proposal_id: proposalId,
      });
    },
    [send]
  );

  const cancelProposal = useCallback(
    (proposalId) => {
      send({
        type: "consult_action",
        action_id: "cancel_proposal",
        proposal_id: proposalId,
      });
    },
    [send]
  );

  const editProposal = useCallback(
    (proposalId) => {
      send({
        type: "consult_action",
        action_id: "edit_proposal",
        proposal_id: proposalId,
      });
      onOpenPlanEditor?.();
    },
    [send, onOpenPlanEditor]
  );

  const sendChat = useCallback(
    (text) => {
      sendConsult(text);
    },
    [sendConsult]
  );

  const answerTicket = useCallback(
    (ticketId) => {
      sendConsult("", { action_id: "resolve_ticket", ticket_id: ticketId });
    },
    [sendConsult]
  );

  const setPhaseStatus = useCallback((nextPhase, message) => {
    setPhase(nextPhase);
    setStatusMessage(message || getPhaseMeta(nextPhase).label);
  }, []);

  // Use the reactive activeProjectId (not activeProjectIdRef) here: this
  // value is read during render, and reading a ref's .current during
  // render doesn't establish a proper reactive dependency -- if it changed
  // without some other state/prop also changing, consumers of chatBlocked
  // could show a stale value for a render or two. activeProjectIdRef stays
  // in use elsewhere in this file (inside stable callbacks/WS handlers,
  // where a ref is the right tool to avoid stale closures without
  // resubscribing).
  const chatBlocked = bindPending || !activeProjectId;

  return {
    phase,
    setPhase,
    statusMessage,
    setStatusMessage,
    messages,
    setMessages,
    intakeStatus,
    setIntakeStatus,
    pendingPrompt,
    setPendingPrompt,
    pendingProposal,
    setPendingProposal,
    hasError,
    setHasError,
    bindPending,
    consultInFlight,
    chatBlocked,
    bindProject,
    startConsult,
    startRun,
    generatePlan,
    approveOutline,
    sendConsult,
    sendChat,
    confirmProposal,
    cancelProposal,
    editProposal,
    answerTicket,
    setPhaseStatus,
  };
}
