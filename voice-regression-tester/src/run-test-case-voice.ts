// src/run-test-case-voice.ts
import { db } from "./lib/db.js";
import { runPhoneConversation } from "./telephony/phone-conversation-runner.js";
import { evaluateAssertion } from "./evaluation/evaluate-assertion.js";
import { AssertionConfigSchema } from "./lib/assertions.js";

export async function runTestCaseOverPhone(testCaseId: string, agentId: string, targetPhoneNumber: string, configVersion?: string) {
  const testCase = await db.testCase.findUniqueOrThrow({ where: { id: testCaseId }, include: { assertions: true } });
  const run = await db.testRun.create({ data: { testCaseId, agentId, status: "RUNNING", configVersion } });
  const result = await runPhoneConversation(testCase, targetPhoneNumber);

  await db.turn.createMany({
    data: result.turns.map((t) => ({ testRunId: run.id, turnNumber: t.turnNumber, role: t.role.toUpperCase() as "CALLER" | "AGENT", content: t.content, latencyMs: t.latencyMs })),
  });

  let allPassed = result.endedReason !== "agent_error";
  for (const assertion of testCase.assertions) {
    if (assertion.type === "TOOL_CALLED" || assertion.type === "TOOL_NOT_CALLED") continue; // no tool visibility over a real phone call
    const config = AssertionConfigSchema.parse(assertion.config);
    const evalResult = await evaluateAssertion(config, result);
    allPassed &&= evalResult.passed;
    await db.assertionResult.create({ data: { testRunId: run.id, assertionId: assertion.id, passed: evalResult.passed, actualValue: evalResult.actualValue, message: evalResult.message } });
  }

  return db.testRun.update({ where: { id: run.id }, data: { status: allPassed ? "PASSED" : "FAILED", totalLatencyMs: result.totalLatencyMs, completedAt: new Date() } });
}