// components/pass-fail-trend.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TOOLTIP_STYLE = { background: "rgba(20,21,24,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 12, color: "#EDEEF0" };

export function PassFailTrend({ runs }: { runs: { id: string; status: string; startedAt: string }[] }) {
  const data = runs.map((r, i) => ({ index: i + 1, value: r.status === "PASSED" ? 1 : 0, label: new Date(r.startedAt).toLocaleDateString() }));
  if (data.length < 2) return null;

  return (
    <div className="rounded-3xl border border-glass-border bg-glass-fill backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_-20px_rgba(0,0,0,0.7)] p-5">
      <div className="text-xs font-mono text-ink-muted uppercase tracking-wide mb-2">Pass rate trend</div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="index" hide />
          <YAxis domain={[0, 1]} hide />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => (Number(v ?? 0) === 1 ? "Passed" : "Failed")} labelFormatter={(_l, p) => p?.[0]?.payload?.label ?? ""} />
          <Line type="stepAfter" dataKey="value" stroke="#8FBF9F" strokeWidth={2} dot={{ r: 3, fill: "#8FBF9F", strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
