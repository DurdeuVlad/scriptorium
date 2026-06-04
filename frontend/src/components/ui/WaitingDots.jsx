export default function WaitingDots({ label = "Working" }) {
  return (
    <span className="animate-waiting-dots" role="status" aria-live="polite">
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
