// scripts/promote-baselines.ts
// Sets each test case's most recent run as its baseline. Run once after the
// first suite run, or whenever you want to "accept" the current behavior as correct.
import { db } from "../src/lib/db.js";
import { setBaseline } from "../src/baselines/set-baseline.js";

async function main() {
  const agentName = process.argv[2] ?? "Reference Booking Agent";
  const agent = await db.agent.findFirstOrThrow({ where: { name: agentName } });
  const testCases = await db.testCase.findMany({
    include: { testRuns: { where: { agentId: agent.id }, orderBy: { startedAt: "desc" }, take: 1 } },
  });

  for (const tc of testCases) {
    const latest = tc.testRuns[0];
    if (!latest) {
      console.log(`Skipping "${tc.name}" — no runs yet.`);
      continue;
    }
    await setBaseline(latest.id);
    console.log(`Baseline set for "${tc.name}" → run ${latest.id} (${latest.status})`);
  }
  await db.$disconnect();
}
main();