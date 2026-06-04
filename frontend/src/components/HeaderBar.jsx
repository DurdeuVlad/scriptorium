import PhaseStepper from "./PhaseStepper.jsx";
import ProjectSwitcher from "./ProjectSwitcher.jsx";

export default function HeaderBar({
  projects,
  activeProjectId,
  activeProjectName,
  phase,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  assistantExpanded,
  assistantBadgeCount,
  onToggleAssistant,
  onToggleNav,
  showNavToggle,
  documentPanelLabel = "Document",
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        {showNavToggle && (
          <button
            type="button"
            className="btn-icon header-menu-btn"
            aria-label="Open document navigation"
            onClick={onToggleNav}
          >
            ☰
          </button>
        )}
        <div className="header-brand">
          <h1>Scriptorium</h1>
        </div>
        <ProjectSwitcher
          projects={projects}
          activeProjectId={activeProjectId}
          activeProjectName={activeProjectName}
          phase={phase}
          onSelect={onSelectProject}
          onNew={onNewProject}
          onDelete={onDeleteProject}
        />
      </div>

      <div className="header-center">
        {activeProjectId && <PhaseStepper phase={phase} />}
      </div>

      <div className="header-right">
        <button
          type="button"
          id="assistant-toggle"
          className={`btn-assistant-toggle${assistantExpanded ? " open" : ""}`}
          aria-expanded={assistantExpanded}
          onClick={onToggleAssistant}
        >
          {documentPanelLabel}
          {assistantBadgeCount > 0 && (
            <span className="assistant-badge">{assistantBadgeCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
