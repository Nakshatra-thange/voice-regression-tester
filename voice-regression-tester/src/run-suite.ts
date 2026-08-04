// src/run-suite.ts
import { db } from "./lib/db.js";
import { testRunQueue } from "./queue/test-run-queue.js";
import { QueueEvents } from "bullmq";
import { connection } from "./queue/connection.js";
import { randomUUID } from "node:crypto";

export async function runSuite(opts: { agentId: string; configVersion: string; tag?: string }) {
  const testCases = await db.testCase.findMany({ where: opts.tag ? { tags: { has: opts.tag } } : {} });
  if (testCases.length === 0) throw new Error("No test cases matched — nothing to run.");

  const suiteRunId = randomUUID();
  const queueEvents = new QueueEvents("test-runs", { connection });
  await queueEvents.waitUntilReady();

  const jobs = await Promise.all(
    testCases.map((tc) => testRunQueue.add("run-test-case", { testCaseId: tc.id, agentId: opts.agentId, configVersion: opts.configVersion, suiteRunId }))
  );

  console.log(`Enqueued ${jobs.length} test case(s) for agent ${opts.agentId} @ ${opts.configVersion}. Waiting...`);
  const results = await Promise.all(jobs.map((job) => job.waitUntilFinished(queueEvents).catch((err) => ({ error: err.message }))));
  await queueEvents.close();

  const passed = results.filter((r: any) => r.status === "PASSED").length;
  const failed = results.filter((r: any) => r.status === "FAILED").length;
  const errored = results.filter((r: any) => r.error || r.status === "ERROR").length;
  const regressions = results.reduce((sum: number, r: any) => sum + (r.regressions ?? 0), 0);

  console.log(`\n=== Suite summary ===\nTotal: ${testCases.length} | Passed: ${passed} | Failed: ${failed} | Errored: ${errored}`);
  console.log(`Regressions vs baseline: ${regressions}`);

  return { suiteRunId, total: testCases.length, passed, failed, errored, regressions, results };
}