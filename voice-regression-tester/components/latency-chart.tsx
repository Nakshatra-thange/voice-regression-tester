// components/latency-chart.tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const TOOLTIP_STYLE = { background: "rgba(20,21,24,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 12, color: "#EDEEF0" };

export function LatencyChart({ turns }: { turns: { turnNumber: number; role: string; latencyMs: number }[] }) {
  const agentTurns = turns.filter((t) => t.role === "AGENT" && t.latencyMs > 0);
  if (agentTurns.length === 0) return null;

  return (
    <div className="rounded-3xl border border-glass-border bg-glass-fill backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_-20px_rgba(0,0,0,0.7)] p-5">
      <div className="text-xs font-mono text-ink-muted uppercase tracking-wide mb-3">Latency per reply</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={agentTurns}>
          <XAxis dataKey="turnNumber" tick={{ fontSize: 10, fill: "#8A8F98" }} tickFormatter={(v) => `T${v}`} />
          <YAxis tick={{ fontSize: 10, fill: "#8A8F98" }} width={40} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}ms`, "Latency"]} labelFormatter={(l) => `Turn ${l}`} />
          <Bar dataKey="latencyMs" radius={[6, 6, 0, 0]}>
            {agentTurns.map((t, i) => <Cell key={i} fill={t.latencyMs > 4000 ? "#E38B85" : "#7C93B0"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}