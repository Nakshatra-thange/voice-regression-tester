
import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { connection } from "./connection.js";
import type { RunTestCaseJobData } from "./types.js";
import { runTestCase } from "../run-test-case.js";
import { diffAgainstBaseline } from "../baselines/diff-runs.js";

const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 5);
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS ?? 60_000);

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Job exceeded ${ms}ms timeout`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

const worker = new Worker<RunTestCaseJobData>(
  "test-runs",
  async (job: Job<RunTestCaseJobData>) => {
    const { testCaseId, agentId, configVersion } = job.data;
    const run = await withTimeout(runTestCase(testCaseId, agentId, configVersion), JOB_TIMEOUT_MS);
    const diff = await diffAgainstBaseline(run.id);
    return {
      runId: run.id,
      status: run.status,
      regressions: diff?.assertionDiffs.filter((a) => a.status === "regressed").length ?? 0,
    };
  },
  { connection, concurrency: CONCURRENCY }
);

worker.on("completed", (job, result) =>
  console.log(` [${job.id}] ${job.data.testCaseId} → ${result.status}${result.regressions ? ` (${result.regressions} regressions)` : ""}`)
);
worker.on("failed", (job, err) =>
  console.error(` [${job?.id}] ${job?.data.testCaseId} failed after ${job?.attemptsMade} attempt(s): ${err.message}`)
);

console.log(`Worker started — concurrency=${CONCURRENCY}, per-job timeout=${JOB_TIMEOUT_MS}ms`);