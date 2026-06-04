import ActivityRing from "./ActivityRing.jsx";

const LABELS = {
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

export default function SaveStatusBadge({ status }) {
  if (!status) return null;

  return (
    <span className={`save-status-badge ${status}`} role="status" aria-live="polite">
      {status === "saving" && <ActivityRing size="sm" label="Saving" />}
      {LABELS[status] || status}
    </span>
  );
}
