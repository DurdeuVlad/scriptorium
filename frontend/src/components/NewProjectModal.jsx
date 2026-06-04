import { useEffect, useState } from "react";
import ActivityRing from "./ui/ActivityRing.jsx";

const DOMAINS = [
  {
    value: "technical-docs",
    label: "Technical documentation",
    hint: "API references, guides, and how-tos for developers.",
  },
  {
    value: "creative-book",
    label: "Book / long-form narrative",
    hint: "Chapters, story arcs, and narrative pacing.",
  },
];

export default function NewProjectModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialPrompt = "",
  initialDomain = "technical-docs",
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [domain, setDomain] = useState(initialDomain);
  const [name, setName] = useState("");

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!prompt.trim() || isSubmitting) return;
    onSubmit({
      prompt: prompt.trim(),
      audience: "",
      domain,
      name: name.trim() || undefined,
    });
  };

  return (
    <div className="modal-backdrop animate-fade-in" role="presentation" onClick={handleClose}>
      <div
        className="modal-card animate-enter"
        id="new-project-modal"
        role="dialog"
        aria-labelledby="new-project-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="new-project-title">New project</h2>
          <button type="button" className="btn-ghost" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal-body">
          <p className="modal-step-label">
            Tell us the gist — your editorial desk will ask follow-ups in the assistant.
          </p>
          <label htmlFor="new-project-prompt">What are you creating?</label>
          <textarea
            id="new-project-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe the document in a sentence or two…"
          />

          <p className="modal-step-label">Writing mode</p>
          <div className="domain-options">
            {DOMAINS.map((d) => (
              <label key={d.value} className={`domain-option${domain === d.value ? " selected" : ""}`}>
                <input
                  type="radio"
                  name="domain"
                  value={d.value}
                  checked={domain === d.value}
                  onChange={() => setDomain(d.value)}
                />
                <span className="domain-option-label">{d.label}</span>
                <span className="domain-option-hint">{d.hint}</span>
              </label>
            ))}
          </div>

          <label htmlFor="new-project-name">Project name (optional)</label>
          <input
            id="new-project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-generated from your topic if empty"
          />

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              id="btn-commission-project"
              className="btn-primary"
              disabled={isSubmitting || !prompt.trim()}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <span className="btn-with-spinner">
                  <ActivityRing size="sm" label="Starting" />
                  Starting…
                </span>
              ) : (
                "Start consultation"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
