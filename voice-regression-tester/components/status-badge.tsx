import React from "react";

type RunStatus = "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "ERROR";

interface StatusBadgeProps {
  status: RunStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  let styles = "bg-slate-800 text-slate-300 border-slate-700";
  let dotColor = "bg-slate-400";

  switch (normalized) {
    case "PASSED":
      styles = "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";
      dotColor = "bg-emerald-400";
      break;
    case "FAILED":
      styles = "bg-rose-950/80 text-rose-300 border-rose-800/60";
      dotColor = "bg-rose-400";
      break;
    case "RUNNING":
      styles = "bg-amber-950/80 text-amber-300 border-amber-800/60 animate-pulse";
      dotColor = "bg-amber-400";
      break;
    case "ERROR":
      styles = "bg-red-950/80 text-red-300 border-red-800/60";
      dotColor = "bg-red-400";
      break;
    case "PENDING":
      styles = "bg-slate-900 text-slate-400 border-slate-800";
      dotColor = "bg-slate-500";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${styles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {normalized}
    </span>
  );
}
