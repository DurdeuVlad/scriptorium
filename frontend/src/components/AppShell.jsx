export default function AppShell({
  header,
  documentNav,
  mainChat,
  documentPanel,
  navOpen,
  onNavBackdropClick,
  showDocumentPanel = true,
}) {
  return (
    <div className="app-shell">
      {header}
      <div className={`app-body chat-first${showDocumentPanel ? " doc-panel-open" : ""}`}>
        <div
          className={`nav-drawer${navOpen ? " open" : ""}`}
          id="document-nav-drawer"
        >
          {documentNav}
        </div>
        {navOpen && (
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close navigation"
            onClick={onNavBackdropClick}
          />
        )}
        <div className="chat-primary">{mainChat}</div>
        {showDocumentPanel && (
          <aside className="document-panel" id="document-panel">
            {documentPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
