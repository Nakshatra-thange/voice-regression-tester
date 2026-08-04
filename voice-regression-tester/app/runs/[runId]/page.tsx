import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/src/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { LatencyChart } from "@/components/latency-chart";

export const revalidate = 0;

interface RunPageProps {
  params: Promise<{ runId: string }>;
}

export default async function TestRunDetailPage({ params }: RunPageProps) {
  const { runId } = await params;

  let run;
  try {
    run = await db.testRun.findUnique({
      where: { id: runId },
      include: {
        testCase: true,
        agent: true,
        turns: { orderBy: { turnNumber: "asc" } },
        assertionResults: { include: { assertion: true } },
      },
    });
  } catch (err) {
    // Database fallback logic
  }

  if (!run) {
    return notFound();
  }

  const latencyData = run.turns
    .filter((t) => t.latencyMs != null)
    .map((t) => ({
      turn: `Turn ${t.turnNumber}`,
      latencyMs: t.latencyMs!,
    }));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-xs text-indigo-400 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Run Details #{run.id.slice(-8)}
          </h1>
          <StatusBadge status={run.status} />
        </div>
        <p className="text-sm text-[#94a3b8] mt-1">
          TestCase:{" "}
          <Link href={`/test-cases/${run.testCaseId}`} className="text-indigo-400 hover:underline font-medium">
            {run.testCase.name}
          </Link>{" "}
          • Agent: <span className="text-white">{run.agent.name}</span>
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs text-[#94a3b8]">Total Latency</span>
          <p className="text-xl font-semibold text-white mt-1">
            {run.totalLatencyMs ? `${run.totalLatencyMs} ms` : "N/A"}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs text-[#94a3b8]">Config Version</span>
          <p className="text-xl font-semibold text-white mt-1">{run.configVersion || "default"}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs text-[#94a3b8]">Baseline Run</span>
          <p className="text-xl font-semibold text-white mt-1">{run.isBaseline ? "Yes" : "No"}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs text-[#94a3b8]">Started At</span>
          <p className="text-sm font-semibold text-white mt-1">
            {new Date(run.startedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Latency Chart */}
      <LatencyChart data={latencyData} />

      {/* Assertion Results */}
      <div className="p-6 rounded-xl border border-[#232b3b] bg-[#141a24] space-y-4">
        <h2 className="text-lg font-semibold text-white">Assertion Evaluation Breakdown</h2>
        <div className="space-y-3">
          {run.assertionResults.map((res) => (
            <div
              key={res.id}
              className={`p-4 rounded-lg border ${
                res.passed
                  ? "bg-emerald-950/20 border-emerald-800/40"
                  : "bg-rose-950/20 border-rose-800/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-white">
                  {res.assertion.type}: {res.assertion.description || "Assertion"}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    res.passed ? "bg-emerald-900 text-emerald-300" : "bg-rose-900 text-rose-300"
                  }`}
                >
                  {res.passed ? "PASSED" : "FAILED"}
                </span>
              </div>
              {res.message && <p className="text-xs text-[#94a3b8] mt-2">{res.message}</p>}
              {res.actualValue && (
                <div className="mt-2 text-xs font-mono text-slate-300 bg-[#0b0f17] p-2 rounded border border-[#232b3b]">
                  Actual: {res.actualValue}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Turn Transcript */}
      <div className="p-6 rounded-xl border border-[#232b3b] bg-[#141a24] space-y-4">
        <h2 className="text-lg font-semibold text-white">Conversation Transcript</h2>
        <div className="space-y-4">
          {run.turns.map((turn) => {
            const isCaller = turn.role === "CALLER";
            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isCaller ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-2xl p-4 rounded-xl border ${
                    isCaller
                      ? "bg-indigo-950/30 border-indigo-800/50 text-indigo-100"
                      : "bg-[#0b0f17] border-[#232b3b] text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-xs font-semibold opacity-75">
                    <span>{turn.role} (Turn #{turn.turnNumber})</span>
                    {turn.latencyMs != null && <span>{turn.latencyMs} ms</span>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</p>

                  {turn.toolCalls && (
                    <div className="mt-3 p-2 rounded bg-black/40 border border-slate-700/50 text-xs font-mono text-amber-300">
                      Tool Calls: {JSON.stringify(turn.toolCalls)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
