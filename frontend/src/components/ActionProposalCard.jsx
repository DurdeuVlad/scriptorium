function diffRows(before, after) {
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  const rows = [];
  keys.forEach((key) => {
    const b = before?.[key];
    const a = after?.[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      rows.push({ key, before: b, after: a });
    }
  });
  return rows;
}

function formatVal(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function ActionProposalCard({
  proposal,
  onConfirm,
  onEdit,
  onCancel,
  disabled = false,
}) {
  if (!proposal) return null;

  const pending = proposal.status === "pending" && !disabled;
  const rows = diffRows(proposal.before, proposal.after);

  return (
    <div
      className={`action-proposal-card${pending ? " pending" : " resolved"}`}
      id={`proposal-${proposal.proposal_id}`}
      data-proposal-id={proposal.proposal_id}
    >
      <div className="action-proposal-body">
        <p className="action-proposal-label">Proposed change</p>
        <p className="action-proposal-summary">{proposal.summary}</p>
        {rows.length > 0 && (
          <ul className="action-proposal-diff">
            {rows.map(({ key, before, after }) => (
              <li key={key} className="proposal-diff-row">
                <span className="diff-key">{key}</span>
                <span className="diff-values">
                  {formatVal(before)} → {formatVal(after)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!pending && (
          <p className="action-proposal-status">
            {proposal.status === "confirmed" ? "Confirmed" : "Cancelled"}
          </p>
        )}
      </div>
      {pending && (
        <div className="action-proposal-actions">
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => onConfirm?.(proposal.proposal_id)}
          >
            Confirm
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => onEdit?.(proposal.proposal_id)}
          >
            Edit in plan
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => onCancel?.(proposal.proposal_id)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
