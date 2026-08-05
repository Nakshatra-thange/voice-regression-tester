// app/test-cases/[testCaseId]/page.tsx
import Link from "next/link";
import { db } from "@/src/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { PassFailTrend } from "@/components/pass-fail-trend";

export const dynamic = "force-dynamic";
const GLASS_PANEL = "border border-glass-border bg-glass-fill backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_-20px_rgba(0,0,0,0.7)]";

export default async function TestCaseDetail({ params }: { params: Promise<{ testCaseId: string }> }) {
  const { testCaseId } = await params;
  const testCase = await db.testCase.findUniqueOrThrow({
    where: { id: testCaseId },
    include: { testRuns: { orderBy: { startedAt: "desc" }, take: 30 } },
  });

  return (
    <div>
      <Link href="/" className="text-xs text-ink-muted hover:text-ink">← All test cases</Link>
      <h1 className="text-3xl font-light tracking-tight mt-2 mb-1">{testCase.name}</h1>
      <p className="text-sm text-ink-muted mb-6">{testCase.personaPrompt}</p>

      <PassFailTrend runs={testCase.testRuns.slice().reverse().map((r) => ({ id: r.id, status: r.status, startedAt: r.startedAt.toISOString() }))} />

      <h2 className="text-xs font-mono text-ink-muted uppercase tracking-wide mt-8 mb-3">Run history</h2>
      <div className="space-y-3">
        {testCase.testRuns.map((run) => (
          <Link key={run.id} href={`/runs/${run.id}`} className={`flex items-center justify-between rounded-3xl ${GLASS_PANEL} px-6 py-4 hover:bg-glass-fill-hover transition-colors`}>
            <div className="flex items-center gap-3">
              {run.isBaseline && <span className="rounded-full border border-periwinkle px-2 py-0.5 text-[10px] font-mono text-periwinkle">BASELINE</span>}
              <span className="font-mono text-sm">{run.configVersion ?? "—"}</span>
              <span className="text-xs text-ink-muted">{new Date(run.startedAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-ink-muted font-mono">{run.totalLatencyMs ? `${run.totalLatencyMs}ms` : "—"}</span>
              <StatusBadge status={run.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}