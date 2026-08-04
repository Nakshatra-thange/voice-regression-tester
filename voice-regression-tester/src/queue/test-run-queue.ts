// src/queue/test-run-queue.ts
import { Queue } from "bullmq";
import { connection } from "./connection.js";
import type { RunTestCaseJobData } from "./types.js";

export const testRunQueue = new Queue<RunTestCaseJobData>("test-runs", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 },
  },
});