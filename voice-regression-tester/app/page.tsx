// app/page.tsx
import Link from "next/link";
import { db } from "@/src/lib/db";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";
const GLASS_PANEL = "border border-glass-border bg-glass-fill backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_-20px_rgba(0,0,0,0.7)]";

export default async function DashboardHome() {
  const testCases = await db.testCase.findMany({
    orderBy: { updatedAt: "desc" },
    include: { testRuns: { orderBy: { startedAt: "desc" }, take: 1 } },
  });

  return (
    <div>
      <h1 className="text-3xl font-light tracking-tight mb-1">Test cases</h1>
      <p className="text-sm text-ink-muted mb-6">{testCases.length} scenario(s) tracked</p>
      <div className="space-y-3">
        {testCases.map((tc) => {
          const latest = tc.testRuns[0];
          return (
            <Link key={tc.id} href={`/test-cases/${tc.id}`} className={`flex items-center justify-between rounded-3xl ${GLASS_PANEL} px-6 py-5 hover:bg-glass-fill-hover transition-colors`}>
              <div>
                <div className="font-normal">{tc.name}</div>
                <div className="text-xs text-ink-muted mt-1">{tc.mode === "SCRIPTED" ? "Scripted" : "Goal-driven"} · {tc.tags.join(", ") || "no tags"}</div>
              </div>
              {latest ? <StatusBadge status={latest.status} /> : <span className="text-xs text-ink-muted font-mono">never run</span>}
            </Link>
          );
        })}
        {testCases.length === 0 && (
          <div className={`rounded-3xl ${GLASS_PANEL} px-6 py-10 text-center text-sm text-ink-muted`}>No test cases yet — seed one to get started.</div>
        )}
      </div>
    </div>
  );
}