export default function WelcomeEmpty({
  onStartChat,
  prompt,
  onPromptChange,
  domain = "technical-docs",
  onDomainChange,
  onSubmit,
  isSubmitting,
}) {
  return (
    <div className="welcome-empty welcome-chat-start animate-enter" id="welcome-empty">
      <h2>What are you writing?</h2>
      <p>
        Tell Scriptorium in plain language. It will ask about audience, structure, and voice,
        then run the agency to draft your book or document.
      </p>
      <textarea
        id="welcome-prompt"
        rows={4}
        placeholder="Describe the document in a sentence or two…"
        value={prompt}
        onChange={(e) => onPromptChange?.(e.target.value)}
      />
      <p className="modal-step-label">Writing mode</p>
      <div className="domain-options welcome-domain">
        <label className={`domain-option${domain === "technical-docs" ? " selected" : ""}`}>
          <input
            type="radio"
            name="welcome-domain"
            value="technical-docs"
            checked={domain === "technical-docs"}
            onChange={() => onDomainChange?.("technical-docs")}
          />
          <span className="domain-option-label">Technical documentation</span>
        </label>
        <label className={`domain-option${domain === "creative-book" ? " selected" : ""}`}>
          <input
            type="radio"
            name="welcome-domain"
            value="creative-book"
            checked={domain === "creative-book"}
            onChange={() => onDomainChange?.("creative-book")}
          />
          <span className="domain-option-label">Book / long-form narrative</span>
        </label>
      </div>
      <button
        type="button"
        id="btn-welcome-new"
        className="btn-primary"
        disabled={isSubmitting || !prompt?.trim()}
        onClick={onSubmit || onStartChat}
      >
        {isSubmitting ? "Starting…" : "Start conversation"}
      </button>
    </div>
  );
}
