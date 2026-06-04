import ActivityRing from "./ActivityRing.jsx";

export default function WaitingPanel({ title, hint, busy = true, skeletonRows = 3 }) {
  return (
    <div className="waiting-panel animate-enter" role="status" aria-live="polite">
      {busy && <ActivityRing size="lg" label={title} />}
      <h3 className="waiting-panel-title">{title}</h3>
      {hint && <p className="waiting-panel-hint">{hint}</p>}
      {busy && skeletonRows > 0 && (
        <div className="waiting-panel-skeleton">
          {Array.from({ length: skeletonRows }, (_, i) => (
            <div key={i} className="waiting-panel-skeleton-row animate-shimmer" />
          ))}
        </div>
      )}
    </div>
  );
}
