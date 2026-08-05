// components/status-badge.tsx
import clsx from "clsx";

type Status = "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "ERROR";

const COLOR_CLASS: Record<Status, string> = {
  PENDING: "text-ink-muted",
  RUNNING: "text-periwinkle",
  PASSED: "text-sage",
  FAILED: "text-rose",
  ERROR: "text-rose",
};
const BARS: Record<Status, number[]> = {
  PENDING: [3, 3, 3, 3, 3],
  RUNNING: [4, 8, 5, 9, 4],
  PASSED: [6, 8, 7, 8, 6],
  FAILED: [9, 2, 8, 3, 9],
  ERROR: [9, 2, 8, 3, 9],
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-white/[0.06] backdrop-blur-md px-3 py-1.5">
      <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden className={COLOR_CLASS[status]}>
        {BARS[status].map((h, i) => (
          <rect key={i} x={i * 6} y={(12 - h) / 2} width="3" height={h} rx="1.5" className={clsx("fill-current", status === "RUNNING" && "animate-pulse")} style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </svg>
      <span className={clsx("font-mono text-xs tracking-wide", COLOR_CLASS[status])}>{status}</span>
    </span>
  );
}