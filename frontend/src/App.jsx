import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import AppShell from "./components/AppShell.jsx";
import DocumentNav from "./components/DocumentNav.jsx";
import HeaderBar from "./components/HeaderBar.jsx";
import MainAgentChat from "./components/MainAgentChat.jsx";
import NewProjectModal from "./components/NewProjectModal.jsx";
import WelcomeEmpty from "./components/WelcomeEmpty.jsx";
import Workspace from "./components/Workspace.jsx";
import { API_BASE } from "./config.js";
import { usePipeline } from "./hooks/usePipeline.js";
import { useProject } from "./hooks/useProject.js";
import { getPhaseMeta, canShowExport, isEditablePlanPhase } from "./lib/phases.js";

function App() {
  const project = useProject();
  const activeProjectIdRef = useRef(null);
  const selectedFileRef = useRef(null);
  const saveTimerRef = useRef(null);

  const [showNewModal, setShowNewModal] = useState(false);
  const [welcomePrompt, setWelcomePrompt] = useState("");
  const [welcomeDomain, setWelcomeDomain] = useState("technical-docs");
  const [selectedNav, setSelectedNav] = useState("plan");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [showDocumentPanel, setShowDocumentPanel] = useState(true);

  useEffect(() => {
    activeProjectIdRef.current = project.activeProjectId;
  }, [project.activeProjectId]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const openPlan = useCallback(() => {
    setSelectedNav("plan");
    setSelectedFile(null);
  }, []);

  const openChapter = useCallback((key, content) => {
    setSelectedNav(key);
    setSelectedFile(key);
    setEditorContent(content ?? project.manuscript[key] ?? "");
  }, [project.manuscript]);

  const openPreview = useCallback(() => {
    setSelectedNav("preview");
    setSelectedFile(null);
  }, []);

  const onOutlineProposal = useCallback(
    (data) => {
      project.setBrief(data.brief);
      project.setOutline(data.outline);
      if (data.agency_settings) project.setAgencySettings(data.agency_settings);
      openPlan();
      setShowDocumentPanel(true);
    },
    [project, openPlan]
  );

  const onPlanPatch = useCallback(
    ({ brief, outline, agency_settings, active_style_pack }) => {
      if (brief != null) project.setBrief(brief);
      if (outline != null) project.setOutline(outline);
      if (agency_settings != null) project.setAgencySettings(agency_settings);
      if (active_style_pack != null) project.setActiveStylePack(active_style_pack);
    },
    [project]
  );

  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  const onFileUpdate = useCallback(
    (data, _currentFile, setContent) => {
      const key = data.filename.replace(/\.md$/, "");
      project.setManuscript((prev) => ({ ...prev, [key]: data.content }));
      if (selectedFileRef.current === key) {
        setContent(data.content);
      }
    },
    [project]
  );

  const onRunComplete = useCallback(
    (data) => {
      const normalised = {};
      Object.entries(data.manuscript || {}).forEach(([k, v]) => {
        normalised[k.replace(/\.md$/, "")] = v;
      });
      project.setManuscript(normalised);
      project.setEditorialMemo(data.editorial_memo || []);
      if (activeProjectIdRef.current) {
        project.syncArtifactsFromDisk(activeProjectIdRef.current, normalised);
      }
      setShowDocumentPanel(true);
    },
    [project]
  );

  const onEditorialMemoSync = useCallback(
    (memo) => {
      project.setEditorialMemo(memo || []);
    },
    [project]
  );

  const handleExport = useCallback(
    async (format) => {
      if (!activeProjectIdRef.current) return;
      setExportStatus(`Exporting ${format.toUpperCase()}…`);
      try {
        const res = await fetch(`${API_BASE}/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            project_id: activeProjectIdRef.current,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const path = data.exported_file || data.merged_manuscript;
          setExportStatus(
            data.fallback
              ? data.message || `Saved locally: ${path}`
              : `Exported: ${path}`
          );
        } else {
          setExportStatus(`Export failed: ${data.error || "Unknown error"}`);
        }
      } catch (e) {
        setExportStatus(`Export failed: ${e.message}`);
      }
    },
    []
  );

  const pipeline = usePipeline({
    activeProjectIdRef,
    onOutlineProposal,
    onPlanPatch,
    onFileUpdate,
    onRunComplete,
    onEditorialMemoSync,
    onProjectsRefresh: project.fetchProjects,
    onExportRequested: handleExport,
    onOpenPlanEditor: () => {
      setShowDocumentPanel(true);
      openPlan();
    },
    selectedFile,
    setSelectedFile,
    setEditorContent,
  });

  const loadProject = useCallback(
    async (projectId) => {
      setIsLoadingProject(true);
      pipeline.setMessages([
        { sender: "System", text: "Loading project…", kind: "system" },
      ]);
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}`);
        if (!res.ok) return;
        const loaded = await res.json();
        const snap = loaded.state || {};

        const normalised = {};
        Object.entries(snap.manuscript || {}).forEach(([k, v]) => {
          normalised[k.replace(/\.md$/, "")] = v;
        });

        project.setActiveProjectId(projectId);
        activeProjectIdRef.current = projectId;
        localStorage.setItem("scriptorium_active_project", projectId);

        pipeline.setPhase(loaded.phase || "idle");
        pipeline.setIntakeStatus(snap.intake_status || "not_started");
        pipeline.setPendingPrompt(snap.pending_prompt || null);
        pipeline.setPendingProposal(snap.pending_proposal || null);
        project.setEditorialMemo(snap.editorial_memo || []);
        project.setBrief(snap.brief || null);
        project.setOutline(snap.outline || null);
        project.setAgencySettings(snap.agency_settings || null);
        project.setActiveStylePack(
          snap.active_style_pack || snap.brief?.style_pack || ""
        );
        project.setPrompt(loaded.prompt);
        project.setAudience(loaded.audience);
        project.setDomain(loaded.domain);

        const merged = await project.syncArtifactsFromDisk(projectId, normalised);
        const chapterKeys = Object.keys(merged).filter((k) => k !== "final_manuscript");
        const inNegotiation = (loaded.phase || "") === "negotiation";

        if (inNegotiation || (!chapterKeys.length && (snap.brief || snap.outline))) {
          openPlan();
        } else if (chapterKeys.length) {
          openChapter(chapterKeys[0], merged[chapterKeys[0]]);
        } else {
          openPlan();
        }
        setEditorContent("");

        if (snap.conversation?.length) {
          const convo = snap.conversation.map((m) => ({
            sender:
              m.role === "user"
                ? "You"
                : m.role === "assistant"
                  ? "Scriptorium"
                  : "System",
            text: m.content,
            kind:
              m.role === "assistant"
                ? "consult"
                : m.role === "user"
                  ? "user"
                  : "system",
          }));
          if (snap.pending_proposal) {
            convo.push({
              sender: "System",
              text: "",
              kind: "proposal",
              proposal: snap.pending_proposal,
            });
          }
          pipeline.setMessages(convo);
        } else {
          pipeline.setMessages([
            {
              sender: "System",
              text: `Project "${loaded.name}" loaded.`,
              kind: "system",
            },
          ]);
        }

        pipeline.setStatusMessage(
          `"${loaded.name}" — ${getPhaseMeta(loaded.phase).label}`
        );

        // Bind after REST chat hydrate so conversation_sync merges instead of being overwritten.
        pipeline.bindProject(projectId);
      } catch (e) {
        console.error("loadProject failed:", e);
      } finally {
        setIsLoadingProject(false);
      }
    },
    [project, pipeline, openPlan, openChapter]
  );

  useEffect(() => {
    project.fetchProjects().then((list) => {
      const lastId = localStorage.getItem("scriptorium_active_project");
      if (lastId && list.find((p) => p.id === lastId)) {
        loadProject(lastId);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleSave = (projectId, artifactId, content) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("Saving…");
    saveTimerRef.current = setTimeout(async () => {
      const ok = await project.persistArtifact(projectId, artifactId, content);
      setSaveStatus(ok ? "Saved" : "Save failed");
    }, 600);
  };

  const handleCreateProject = async ({ prompt, audience, domain, name }) => {
    if (!prompt.trim()) return;
    setIsSubmittingProject(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          audience: audience || "",
          domain,
          name,
        }),
      });
      const created = await res.json();

      project.setProjects((prev) => [created, ...prev]);
      project.setActiveProjectId(created.id);
      activeProjectIdRef.current = created.id;
      localStorage.setItem("scriptorium_active_project", created.id);

      project.setPrompt(prompt);
      project.setAudience(audience || "");
      project.setDomain(domain);
      project.setManuscript({});
      project.setArtifactMeta([]);
      project.setBrief({ goal: prompt, domain });
      project.setOutline(null);
      project.setAgencySettings(null);
      project.setActiveStylePack("");
      project.setEditorialMemo([]);
      openPlan();
      setShowNewModal(false);
      setWelcomePrompt("");

      pipeline.setMessages([]);
      pipeline.bindProject(created.id);
      pipeline.startConsult(created.id, prompt, audience || "", domain);
    } catch (e) {
      console.error("handleCreateProject failed:", e);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleWelcomeStart = () => {
    handleCreateProject({
      prompt: welcomePrompt,
      audience: "",
      domain: welcomeDomain,
    });
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project and all its files? This cannot be undone."))
      return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}`, { method: "DELETE" });
      project.setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (project.activeProjectId === projectId) {
        project.resetProjectState();
        activeProjectIdRef.current = null;
        localStorage.removeItem("scriptorium_active_project");
        openPlan();
        pipeline.setPhase("idle");
        pipeline.setStatusMessage("Tell Scriptorium what you want to write.");
        pipeline.setMessages([
          { sender: "System", text: "Welcome to Scriptorium." },
        ]);
      }
    } catch (e) {
      console.error("handleDeleteProject failed:", e);
    }
  };

  const handlePlanChange = ({ brief, outline, agency_settings, active_style_pack }) => {
    project.setBrief(brief);
    project.setOutline(outline);
    if (agency_settings != null) project.setAgencySettings(agency_settings);
    if (active_style_pack != null) project.setActiveStylePack(active_style_pack);
  };

  const handleAgencySettingsChange = (next) => {
    project.setAgencySettings(next);
    if (project.activeProjectId) {
      project.persistPlan(project.activeProjectId, {
        agency_settings: next,
        brief: project.brief,
        outline: project.outline,
      });
    }
  };

  const handleStylePackChange = (voiceId) => {
    project.setActiveStylePack(voiceId);
    if (project.activeProjectId) {
      project.persistPlan(project.activeProjectId, {
        active_style_pack: voiceId,
        brief: { ...(project.brief || {}), style_pack: voiceId },
        outline: project.outline,
      });
    }
  };

  const activeProject = project.projects.find((p) => p.id === project.activeProjectId);
  const chapterKeys = Object.keys(project.manuscript).filter((k) => k !== "final_manuscript");
  const hasFinal = project.manuscript.final_manuscript != null;
  const previewContent = hasFinal
    ? project.manuscript.final_manuscript
    : chapterKeys.map((k) => project.manuscript[k]).join("\n\n---\n\n");

  const agencySettingsEditable = isEditablePlanPhase(pipeline.phase);

  const mainChatContent = project.activeProjectId ? (
    <MainAgentChat
      phase={pipeline.phase}
      statusMessage={pipeline.statusMessage}
      editorialMemo={project.editorialMemo}
      messages={pipeline.messages}
      chatInput={chatInput}
      onChatInputChange={setChatInput}
      onSendChat={(text) => {
        if (pipeline.chatBlocked) return;
        const message = (typeof text === "string" ? text : chatInput).trim();
        if (!message && !pipeline.pendingPrompt) return;
        pipeline.sendConsult(message);
        if (text == null) setChatInput("");
      }}
      chatBlocked={pipeline.chatBlocked}
      consultInFlight={pipeline.consultInFlight}
      onConsultAction={(opts) => {
        pipeline.sendConsult(opts.choice || "", opts);
        setChatInput("");
      }}
      onGeneratePlan={pipeline.generatePlan}
      onAnswerTicket={pipeline.answerTicket}
      intakeStatus={pipeline.intakeStatus}
      pendingPrompt={pipeline.pendingPrompt}
      pendingProposal={pipeline.pendingProposal}
      onConfirmProposal={pipeline.confirmProposal}
      onCancelProposal={pipeline.cancelProposal}
      onEditProposal={pipeline.editProposal}
      pipelineBusy={pipeline.phase === "planning" || pipeline.phase === "drafting"}
      onApproveOutline={pipeline.approveOutline}
      exportStatus={exportStatus}
      showNegotiation={pipeline.phase === "negotiation"}
      showExport={canShowExport(pipeline.phase, project.manuscript)}
      agencySettings={project.agencySettings}
      onAgencySettingsChange={handleAgencySettingsChange}
      activeStylePack={project.activeStylePack}
      onStylePackChange={handleStylePackChange}
      projectId={project.activeProjectId}
      agencySettingsEditable={agencySettingsEditable}
      showDocumentPanel={showDocumentPanel}
      onToggleDocumentPanel={() => setShowDocumentPanel((v) => !v)}
    />
  ) : (
    <div className="welcome-chat-wrap">
      <WelcomeEmpty
        prompt={welcomePrompt}
        onPromptChange={setWelcomePrompt}
        domain={welcomeDomain}
        onDomainChange={setWelcomeDomain}
        onSubmit={handleWelcomeStart}
        isSubmitting={isSubmittingProject}
      />
    </div>
  );

  return (
    <>
      <AppShell
        navOpen={isMobile && navOpen}
        onNavBackdropClick={() => setNavOpen(false)}
        showDocumentPanel={showDocumentPanel && !!project.activeProjectId}
        header={
          <HeaderBar
            projects={project.projects}
            activeProjectId={project.activeProjectId}
            activeProjectName={activeProject?.name}
            phase={pipeline.phase}
            onSelectProject={loadProject}
            onNewProject={() => setShowNewModal(true)}
            onDeleteProject={handleDeleteProject}
            assistantExpanded={showDocumentPanel}
            assistantBadgeCount={project.editorialMemo.filter((t) => !t.resolved).length}
            onToggleAssistant={() => setShowDocumentPanel((v) => !v)}
            onToggleNav={() => setNavOpen((v) => !v)}
            showNavToggle={isMobile}
            documentPanelLabel="Document"
          />
        }
        documentNav={
          <DocumentNav
            activeProjectId={project.activeProjectId}
            selectedNav={selectedNav}
            chapterKeys={chapterKeys}
            outline={project.outline}
            hasFinal={hasFinal}
            onSelectPlan={() => {
              openPlan();
              if (isMobile) setNavOpen(false);
            }}
            onSelectChapter={(key) => {
              openChapter(key, project.manuscript[key]);
              if (isMobile) setNavOpen(false);
            }}
            onSelectPreview={() => {
              openPreview();
              if (isMobile) setNavOpen(false);
            }}
          />
        }
        mainChat={mainChatContent}
        documentPanel={
          <Workspace
            activeProjectId={project.activeProjectId}
            selectedNav={selectedNav}
            phase={pipeline.phase}
            intakeStatus={pipeline.intakeStatus}
            brief={project.brief}
            outline={project.outline}
            prompt={project.prompt}
            audience={project.audience}
            domain={project.domain}
            manuscript={project.manuscript}
            selectedFile={selectedFile}
            editorContent={editorContent}
            saveStatus={saveStatus}
            previewContent={previewContent}
            isLoadingProject={isLoadingProject}
            onPlanChange={handlePlanChange}
            onSavePlan={(payload) =>
              project.persistPlan(project.activeProjectId, payload)
            }
            onEditorChange={(val) => {
              setEditorContent(val);
              project.setManuscript((prev) => ({ ...prev, [selectedFile]: val }));
              if (project.activeProjectId && selectedFile) {
                scheduleSave(project.activeProjectId, selectedFile, val);
              }
            }}
            agencySettings={project.agencySettings}
            activeStylePack={project.activeStylePack}
            onAgencySettingsChange={handleAgencySettingsChange}
            onStylePackChange={handleStylePackChange}
          />
        }
      />

      <NewProjectModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isSubmittingProject}
        initialPrompt={project.prompt}
        initialDomain={project.domain}
      />
    </>
  );
}

export default App;
