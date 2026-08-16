import DraftEditor from "./DraftEditor.jsx";
import PlanEditor from "./PlanEditor.jsx";
import PreviewPanel from "./PreviewPanel.jsx";
import WaitingPanel from "./ui/WaitingPanel.jsx";

export default function Workspace({
  activeProjectId,
  selectedNav,
  phase,
  intakeStatus,
  brief,
  outline,
  prompt,
  audience,
  domain,
  selectedFile,
  editorContent,
  saveStatus,
  previewContent,
  isLoadingProject,
  onPlanChange,
  onSavePlan,
  onEditorChange,
  agencySettings,
  activeStylePack,
  onAgencySettingsChange,
  onStylePackChange,
}) {
  if (!activeProjectId) {
    return null;
  }

  let body;

  if (selectedNav === "plan") {
    body = (
      <PlanEditor
        brief={brief}
        outline={outline}
        prompt={prompt}
        audience={audience}
        domain={domain}
        phase={phase}
        intakeStatus={intakeStatus}
        projectId={activeProjectId}
        onPlanChange={onPlanChange}
        onSavePlan={onSavePlan}
        agencySettings={agencySettings}
        activeStylePack={activeStylePack}
        onAgencySettingsChange={onAgencySettingsChange}
        onStylePackChange={onStylePackChange}
      />
    );
  } else if (selectedNav === "preview") {
    body = <PreviewPanel content={previewContent} />;
  } else {
    body = (
      <DraftEditor
        selectedFile={selectedFile}
        content={editorContent}
        saveStatus={saveStatus}
        onChange={onEditorChange}
      />
    );
  }

  return (
    <div className="document-panel-inner" id="document-panel-inner">
      {isLoadingProject && (
        <div className="project-loading-overlay">
          <WaitingPanel
            title="Loading project"
            hint="Restoring brief, chapters, and pipeline state…"
            skeletonRows={0}
          />
        </div>
      )}
      {body}
    </div>
  );
}
