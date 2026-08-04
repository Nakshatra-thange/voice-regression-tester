// src/run-e2e.ts
import { db } from "./lib/db.js";
import { runTestCase } from "./run-test-case";

async function main() {
  const testCase = await db.testCase.findFirstOrThrow({ where: { name: "Book a cleaning - happy path" } });
  const agent = await db.agent.findFirstOrThrow({ where: { name: "Reference Booking Agent" } });

  const run = await runTestCase(testCase.id, agent.id, "manual-e2e-test");
  const fullRun = await db.testRun.findUniqueOrThrow({
    where: { id: run.id },
    include: { turns: { orderBy: { turnNumber: "asc" } }, assertionResults: { include: { assertion: true } } },
  });

  console.log(`\nRun status: ${fullRun.status}\n\n--- Transcript ---`);
  for (const t of fullRun.turns) console.log(`[${t.role}] ${t.content}`);

  console.log("\n--- Assertions ---");
  for (const r of fullRun.assertionResults) {
    console.log(`${r.passed ? "✅" : "❌"} ${r.assertion.description}: ${r.actualValue ?? ""} ${r.message ?? ""}`);
  }
  await db.$disconnect();
}
main();