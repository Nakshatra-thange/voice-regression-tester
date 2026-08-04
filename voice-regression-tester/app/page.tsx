import Link from "next/link";
import { db } from "@/src/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { PassFailTrend } from "@/components/pass-fail-trend";

export const revalidate = 0;

async function getDashboardData() {
  try {
    const [testCases, testRuns] = await Promise.all([
      db.testCase.findMany({
        include: { assertions: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.testRun.findMany({
        include: {
          testCase: true,
          agent: true,
          assertionResults: true,
        },
        orderBy: { startedAt: "desc" },
        take: 20,
      }),
    ]);
    return { testCases, testRuns, error: null };
  } catch (err: any) {
    return { testCases: [], testRuns: [], error: err.message ?? "Database unavailable" };
  }
}

export default async function DashboardPage() {
  const { testCases, testRuns, error } = await getDashboardData();

  const totalRuns = testRuns.length;
  const passedRuns = testRuns.filter((r) => r.status === "PASSED").length;
  const failedRuns = testRuns.filter((r) => r.status === "FAILED").length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

  // Build trend data by grouping runs by date
  const trendMap = new Map<string, { passed: number; failed: number }>();
  testRuns.forEach((run) => {
    const dateStr = new Date(run.startedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const current = trendMap.get(dateStr) || { passed: 0, failed: 0 };
    if (run.status === "PASSED") current.passed += 1;
    if (run.status === "FAILED") current.failed += 1;
    trendMap.set(dateStr, current);
  });

  const trendData = Array.from(trendMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Monitor voice agent test suites, assertion results, and regression metrics.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-sm">
          <strong>Database Note:</strong> {error}. Make sure DATABASE_URL is set and migrations are applied.
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Test Cases</span>
          <p className="text-3xl font-bold text-white mt-2">{testCases.length}</p>
        </div>
        <div className="p-5 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Total Runs</span>
          <p className="text-3xl font-bold text-white mt-2">{totalRuns}</p>
        </div>
        <div className="p-5 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Pass Rate</span>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{passRate}%</p>
        </div>
        <div className="p-5 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Failed Runs</span>
          <p className="text-3xl font-bold text-rose-400 mt-2">{failedRuns}</p>
        </div>
      </div>

      {/* Trend Chart */}
      <PassFailTrend data={trendData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Cases List */}
        <div className="p-6 rounded-xl border border-[#232b3b] bg-[#141a24] space-y-4">
          <h2 className="text-lg font-semibold text-white">Test Cases</h2>
          {testCases.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No test cases configured yet.</p>
          ) : (
            <div className="divide-y divide-[#232b3b]">
              {testCases.map((tc) => (
                <div key={tc.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/test-cases/${tc.id}`}
                      className="font-medium text-indigo-400 hover:underline"
                    >
                      {tc.name}
                    </Link>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{tc.description || "No description"}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#0b0f17] border border-[#232b3b] text-[#94a3b8]">
                    {tc.mode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Runs List */}
        <div className="p-6 rounded-xl border border-[#232b3b] bg-[#141a24] space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent Test Runs</h2>
          {testRuns.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No test runs recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#232b3b]">
              {testRuns.map((run) => (
                <div key={run.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/runs/${run.id}`}
                      className="font-medium text-white hover:text-indigo-400 transition-colors"
                    >
                      {run.testCase.name}
                    </Link>
                    <p className="text-xs text-[#94a3b8]">
                      Agent: {run.agent.name} {run.configVersion ? `(${run.configVersion})` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={run.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
