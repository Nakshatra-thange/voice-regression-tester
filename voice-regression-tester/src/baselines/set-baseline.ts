
import { db } from "../lib/db.js";

export async function setBaseline(testRunId: string) {
  const run = await db.testRun.findUniqueOrThrow({ where: { id: testRunId } });

  await db.$transaction([
    db.testRun.updateMany({
      where: { testCaseId: run.testCaseId, agentId: run.agentId, isBaseline: true },
      data: { isBaseline: false },
    }),
    db.testRun.update({ where: { id: testRunId }, data: { isBaseline: true } }),
  ]);
}