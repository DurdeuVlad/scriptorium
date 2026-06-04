export default function ActivityRing({ size = "md", label }) {
  const sizeClass = size === "sm" || size === "lg" ? ` size-${size}` : " size-md";
  return (
    <span
      className={`animate-activity-ring${sizeClass}`}
      role="status"
      aria-label={label || "Loading"}
    />
  );
}
