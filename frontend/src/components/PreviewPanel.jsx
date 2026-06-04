export default function PreviewPanel({ content }) {
  return (
    <div className="preview-panel" id="preview-panel">
      <div className="preview-panel-header">
        <h2>Preview</h2>
      </div>
      {content ? (
        <pre className="preview-text">{content}</pre>
      ) : (
        <p className="plan-muted">Nothing to preview yet.</p>
      )}
    </div>
  );
}
