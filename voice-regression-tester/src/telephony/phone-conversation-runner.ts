// src/telephony/phone-conversation-runner.ts
import { randomUUID } from "node:crypto";
import type { TestCase } from "../generated/prisma/client.js";
import type { ConversationTurn } from "../adapters/types.js";
import type { ConversationResult, RecordedTurn } from "../simulation/conversation-runner.js";
import { buildCallerSimulator } from "../simulation/factory.js";
import { placeTestCall } from "./twilio-client.js";
import { registerCallSession } from "./call-session-registry.js";

export async function runPhoneConversation(testCase: TestCase, targetPhoneNumber: string): Promise<ConversationResult> {
  const sessionId = randomUUID();
  const session = registerCallSession(sessionId);

  await placeTestCall(targetPhoneNumber, sessionId);
  await session.waitUntilReady();

  const caller = buildCallerSimulator(testCase); // same Phase 3 interface — nothing new here
  const history: ConversationTurn[] = [];
  const turns: RecordedTurn[] = [];
  let totalLatencyMs = 0, turnNumber = 0, exchangeCount = 0;
  let lastAgentReply: string | null = null;

  try {
    while (exchangeCount < testCase.maxTurns) {
      const callerUtterance = await caller.nextUtterance(history, lastAgentReply);
      if (callerUtterance === null) return { turns, totalLatencyMs, endedReason: "goal_or_script_complete" };

      turnNumber++;
      turns.push({ turnNumber, role: "caller", content: callerUtterance });
      history.push({ role: "caller", content: callerUtterance });
      await session.speak(callerUtterance);

      const speakFinishedAt = Date.now();
      const reply = await session.listenForReply();
      const latencyMs = reply.text ? Date.now() - speakFinishedAt : reply.latencyMs;

      turnNumber++;
      const content = reply.text || "[no response — agent stayed silent]";
      turns.push({ turnNumber, role: "agent", content, latencyMs });
      history.push({ role: "agent", content });
      totalLatencyMs += latencyMs;
      lastAgentReply = content;

      if (!reply.text) return { turns, totalLatencyMs, endedReason: "agent_error" };
      exchangeCount++;
    }
    return { turns, totalLatencyMs, endedReason: "max_turns_reached" };
  } finally {
    session.close();
  }
}