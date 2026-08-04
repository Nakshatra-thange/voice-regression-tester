// src/run-test-case.ts
import { db } from "./lib/db.js";
import { getAdapterForAgent } from "./adapters/registry.js";
import { runConversation } from "./simulation/conversation-runner.js";
import { evaluateAssertion } from "./evaluation/evaluate-assertion.js";
import { AssertionConfigSchema } from "./lib/assertions.js";

export async function runTestCase(testCaseId: string, agentId: string, configVersion?: string) {
  const testCase = await db.testCase.findUniqueOrThrow({ where: { id: testCaseId }, include: { assertions: true } });
  const agent = await db.agent.findUniqueOrThrow({ where: { id: agentId } });

  const run = await db.testRun.create({ data: { testCaseId, agentId, status: "RUNNING", configVersion } as any});
  const result = await runConversation(testCase, getAdapterForAgent(agent));

  await db.turn.createMany({
    data: result.turns.map((t) => ({
      testRunId: run.id,
      turnNumber: t.turnNumber,
      role: t.role.toUpperCase() as "CALLER" | "AGENT",
      content: t.content,
      toolCalls: t.toolCalls ?? undefined,
      latencyMs: t.latencyMs,
    })as any),
  });

  let allPassed = result.endedReason !== "agent_error";
  for (const assertion of testCase.assertions) {
    const config = AssertionConfigSchema.parse(assertion.config);
    const evalResult = await evaluateAssertion(config, result);
    allPassed &&= evalResult.passed;
    await db.assertionResult.create({
      data: { testRunId: run.id, assertionId: assertion.id, passed: evalResult.passed, actualValue: evalResult.actualValue, message: evalResult.message} as any,
    });
  }

  return db.testRun.update({
    where: { id: run.id },
    data: { status: allPassed ? "PASSED" : "FAILED", totalLatencyMs: result.totalLatencyMs, completedAt: new Date() },
  });
}