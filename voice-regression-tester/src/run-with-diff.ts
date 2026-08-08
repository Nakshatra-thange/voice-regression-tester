// src/run-with-diff.ts — proves it end to end
import { db } from "./lib/db.js";
import { runTestCase } from "./run-test-case.js";
import { diffAgainstBaseline } from "./baselines/diff-runs.js";
import { printDiff } from "./baselines/print-diff.js";
import { setBaseline } from "./baselines/set-baseline.js";

async function main() {
  const testCase = await db.testCase.findFirstOrThrow({ where: { name: "Book a cleaning - happy path" } });
  const agent = await db.agent.findFirstOrThrow({ where: { name: "Reference Booking Agent" } });

  const run = await runTestCase(testCase.id, agent.id, process.argv[2] ?? "manual-run");
  console.log(`Run ${run.id} finished: ${run.status}`);

  const diff = await diffAgainstBaseline(run.id);
  if (!diff) {
    console.log("No baseline yet for this pair — promoting this run to baseline.");
    await setBaseline(run.id);
  } else {
    printDiff(diff);
  }
  await db.$disconnect();
}
main();