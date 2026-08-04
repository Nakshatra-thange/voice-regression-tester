import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/src/lib/db";
import { StatusBadge } from "@/components/status-badge";

export const revalidate = 0;

interface TestCasePageProps {
  params: Promise<{ testCaseId: string }>;
}

export default async function TestCaseDetailPage({ params }: TestCasePageProps) {
  const { testCaseId } = await params;

  let testCase;
  try {
    testCase = await db.testCase.findUnique({
      where: { id: testCaseId },
      include: {
        assertions: true,
        testRuns: {
          include: { agent: true, assertionResults: true },
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    });
  } catch (err) {
    // Database connection error handling
  }

  if (!testCase) {
    return notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-xs text-indigo-400 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-2">{testCase.name}</h1>
        <p className="text-sm text-[#94a3b8] mt-1">{testCase.description || "No description provided."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs text-[#94a3b8]">Mode</span>
          <p className="text-lg font-semibold text-white mt-1">{testCase.mode}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs text-[#94a3b8]">Max Turns</span>
          <p className="text-lg font-semibold text-white mt-1">{testCase.maxTurns}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#232b3b] bg-[#141a24]">
          <span className="text-xs text-[#94a3b8]">Assertions</span>
          <p className="text-lg font-semibold text-white mt-1">{testCase.assertions.length}</p>
        </div>
      </div>

      {/* Persona Prompt */}
      <div className="p-6 rounded-xl border border-[#232b3b] bg-[#141a24] space-y-2">
        <h2 className="text-sm font-semibold text-slate-300">Persona Prompt</h2>
        <pre className="p-4 rounded-lg bg-[#0b0f17] text-xs font-mono text-slate-300 border border-[#232b3b] whitespace-pre-wrap">
          {testCase.personaPrompt}
        </pre>
      </div>

      {/* Assertions */}
      <div className="p-6 rounded-xl border border-[#232b3b] bg-[#141a24] space-y-4">
        <h2 className="text-lg font-semibold text-white">Configured Assertions</h2>
        <div className="space-y-3">
          {testCase.assertions.map((a) => (
            <div key={a.id} className="p-3 rounded-lg bg-[#0b0f17] border border-[#232b3b]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400">{a.type}</span>
                <span className="text-xs text-[#94a3b8]">{a.description}</span>
              </div>
              <pre className="mt-2 text-xs font-mono text-slate-400 overflow-x-auto">
                {JSON.stringify(a.config, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Runs */}
      <div className="p-6 rounded-xl border border-[#232b3b] bg-[#141a24] space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent Execution History</h2>
        <div className="divide-y divide-[#232b3b]">
          {testCase.testRuns.map((run) => (
            <div key={run.id} className="py-3 flex items-center justify-between">
              <div>
                <Link href={`/runs/${run.id}`} className="font-medium text-white hover:underline">
                  Run #{run.id.slice(-6)}
                </Link>
                <p className="text-xs text-[#94a3b8]">
                  Agent: {run.agent.name} • {new Date(run.startedAt).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={run.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
