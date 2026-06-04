import { useEffect, useRef, useState } from "react";
import { getPhaseMeta } from "../lib/phases.js";

export default function ProjectSwitcher({
  projects,
  activeProjectId,
  activeProjectName,
  phase,
  onSelect,
  onNew,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const meta = getPhaseMeta(phase);

  return (
    <div className="project-switcher" id="project-switcher" ref={rootRef}>
      <button
        type="button"
        className="project-switcher-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="project-switcher-name">
          {activeProjectName || "Select project"}
        </span>
        {activeProjectId && (
          <span className={`phase-badge tone-${meta.tone}`}>{meta.label}</span>
        )}
        <span className="project-switcher-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="project-switcher-menu">
          <button
            type="button"
            id="btn-new-project"
            className="project-switcher-new"
            onClick={() => {
              setOpen(false);
              onNew();
            }}
          >
            + New project
          </button>
          <ul className="project-switcher-list">
            {projects.length === 0 && (
              <li className="project-switcher-empty">No projects yet.</li>
            )}
            {projects.map((p) => {
              const pMeta = getPhaseMeta(p.phase);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`project-switcher-item${activeProjectId === p.id ? " active" : ""}`}
                    data-project-id={p.id}
                    onClick={() => {
                      onSelect(p.id);
                      setOpen(false);
                    }}
                  >
                    <span className="project-switcher-item-name">{p.name}</span>
                    <span className={`phase-badge tone-${pMeta.tone}`}>{pMeta.label}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-delete-project"
                    title="Delete project"
                    onClick={(e) => onDelete(e, p.id)}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
