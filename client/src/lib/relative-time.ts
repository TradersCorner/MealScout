export function formatRelativeTime(value: string | Date | null | undefined) {
  if (!value) return null;
  const dt = value instanceof Date ? value : new Date(value);
  const ms = dt.getTime();
  if (!Number.isFinite(ms)) return null;

  const diffMs = Date.now() - ms;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 48) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

