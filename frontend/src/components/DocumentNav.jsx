import { buildChapterTree } from "../lib/outlineTree.js";

function NavTreeNode({ node, selectedNav, onSelectChapter, depth = 1 }) {
  const active = selectedNav === node.key;
  return (
    <li>
      <button
        type="button"
        className={`nav-item nav-tree-item depth-${depth}${active ? " active" : ""}`}
        data-artifact={node.key}
        style={{ paddingLeft: `${8 + (depth - 1) * 12}px` }}
        onClick={() => onSelectChapter(node.key)}
      >
        <span className="nav-item-label">{node.label}</span>
        <span className="nav-item-id">{node.key}</span>
      </button>
      {node.children?.length > 0 && (
        <ul className="nav-list nav-sublist">
          {node.children.map((child) => (
            <NavTreeNode
              key={child.key}
              node={child}
              selectedNav={selectedNav}
              onSelectChapter={onSelectChapter}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function DocumentNav({
  activeProjectId,
  selectedNav,
  chapterKeys,
  outline,
  hasFinal,
  onSelectPlan,
  onSelectChapter,
  onSelectPreview,
}) {
  if (!activeProjectId) {
    return (
      <aside className="document-nav document-nav-empty" id="artifact-nav">
        <p className="nav-hint">Open or create a project to browse documents.</p>
      </aside>
    );
  }

  const tree = buildChapterTree(outline, chapterKeys);

  return (
    <aside className="document-nav" id="artifact-nav">
      <h3 className="nav-section-title">Document</h3>
      <ul className="nav-list">
        <li>
          <button
            type="button"
            className={`nav-item${selectedNav === "plan" ? " active" : ""}`}
            data-artifact="plan"
            onClick={onSelectPlan}
          >
            Brief &amp; Outline
          </button>
        </li>
      </ul>

      {tree.length > 0 && (
        <>
          <h4 className="nav-group-title">Chapters</h4>
          <ul className="nav-list nav-tree">
            {tree.map((node) => (
              <NavTreeNode
                key={node.key}
                node={node}
                selectedNav={selectedNav}
                onSelectChapter={onSelectChapter}
              />
            ))}
          </ul>
        </>
      )}

      {chapterKeys.length === 0 && (
        <p className="nav-empty">Chapters appear after outline approval.</p>
      )}

      {(hasFinal || chapterKeys.length > 0) && (
        <>
          <h4 className="nav-group-title">Output</h4>
          <ul className="nav-list">
            <li>
              <button
                type="button"
                className={`nav-item${selectedNav === "preview" ? " active" : ""}`}
                data-artifact="preview"
                onClick={onSelectPreview}
              >
                Preview
              </button>
            </li>
            {hasFinal && (
              <li>
                <button
                  type="button"
                  className={`nav-item${selectedNav === "final_manuscript" ? " active" : ""}`}
                  data-artifact="final_manuscript"
                  onClick={() => onSelectChapter("final_manuscript")}
                >
                  Final manuscript
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </aside>
  );
}
