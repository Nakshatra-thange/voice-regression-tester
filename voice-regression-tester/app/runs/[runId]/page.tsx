// app/runs/[runId]/page.tsx
import Link from "next/link";
import clsx from "clsx";
import { db } from "@/src/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { LatencyChart } from "@/components/latency-chart";
import { diffAgainstBaseline } from "@/src/baselines/diff-runs";

export const dynamic = "force-dynamic";
const GLASS_PANEL = "border border-glass-border bg-glass-fill backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_-20px_rgba(0,0,0,0.7)]";

export default async function RunDetail({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const run = await db.testRun.findUniqueOrThrow({
    where: { id: runId },
    include: { testCase: true, agent: true, turns: { orderBy: { turnNumber: "asc" } }, assertionResults: { include: { assertion: true } } },
  });
  const diff = await diffAgainstBaseline(runId);
  const changed = new Set((diff?.turnDiffs ?? []).filter((t) => t.changed).map((t) => t.turnNumber));

  return (
    <div>
      <Link href={`/test-cases/${run.testCaseId}`} className="text-xs text-ink-muted hover:text-ink">← {run.testCase.name}</Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight">{run.configVersion ?? run.id}</h1>
          <p className="text-xs text-ink-muted mt-1">{run.agent.name} · {new Date(run.startedAt).toLocaleString()}</p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {diff?.overallStatusChanged && (
        <div className="mb-6 rounded-3xl border border-amber/40 bg-amber/10 backdrop-blur-xl px-5 py-4 text-sm">
          ⚠️ Status changed vs baseline: <span className="font-mono">{diff.baselineStatus}</span> → <span className="font-mono">{diff.currentStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-8">
          <div>
            <h2 className="text-xs font-mono text-ink-muted uppercase tracking-wide mb-3">Transcript</h2>
            <div className={`rounded-3xl ${GLASS_PANEL} divide-y divide-white/10 overflow-hidden`}>
              {run.turns.map((turn) => (
                <div key={turn.id} className={clsx("px-5 py-4 font-mono text-sm", changed.has(turn.turnNumber) && "bg-amber/10 border-l-4 border-l-amber")}>
                  <div className="flex items-center gap-2 text-[10px] text-ink-muted mb-1 tracking-wide">
                    <span>T{String(turn.turnNumber).padStart(2, "0")}</span>
                    <span className={turn.role === "AGENT" ? "text-periwinkle" : "text-ink-muted"}>{turn.role}</span>
                    {turn.latencyMs != null && <span>· {turn.latencyMs}ms</span>}
                    {changed.has(turn.turnNumber) && <span className="text-amber">· changed vs baseline</span>}
                  </div>
                  <div className="font-sans text-ink font-normal">{turn.content}</div>
                  {Array.isArray(turn.toolCalls) && turn.toolCalls.length > 0 && (
                    <div className="mt-2 text-xs text-sage">→ tool_call: {JSON.stringify(turn.toolCalls)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-mono text-ink-muted uppercase tracking-wide mb-3">Assertions</h2>
            <div className={`rounded-3xl ${GLASS_PANEL} divide-y divide-white/10 overflow-hidden`}>
              {run.assertionResults.map((ar) => (
                <div key={ar.id} className="flex items-start justify-between px-5 py-4 text-sm">
                  <div>
                    <div className={ar.passed ? "text-sage" : "text-rose"}>{ar.passed ? "✓" : "✗"} {ar.assertion.description ?? ar.assertion.type}</div>
                    {ar.message && <div className="text-xs text-ink-muted mt-1">{ar.message}</div>}
                  </div>
                  <div className="font-mono text-xs text-ink-muted">{ar.actualValue}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <LatencyChart turns={run.turns.map((t) => ({ turnNumber: t.turnNumber, role: t.role, latencyMs: t.latencyMs ?? 0 }))} />
          {diff && (
            <div className={`rounded-3xl ${GLASS_PANEL} p-5`}>
              <div className="text-xs font-mono text-ink-muted uppercase tracking-wide mb-3">vs baseline</div>
              <div className="text-sm space-y-2 font-normal">
                <div>Latency: <span className="font-mono">{diff.latencyDeltaMs >= 0 ? "+" : ""}{diff.latencyDeltaMs}ms</span></div>
                <div>Turns: <span className="font-mono">{diff.turnCountDelta >= 0 ? "+" : ""}{diff.turnCountDelta}</span></div>
                <div>Regressions: <span className="font-mono text-rose">{diff.assertionDiffs.filter((a) => a.status === "regressed").length}</span></div>
                <Link href={`/runs/${diff.baselineRunId}`} className="block text-xs text-periwinkle mt-2 hover:underline">View baseline run →</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}