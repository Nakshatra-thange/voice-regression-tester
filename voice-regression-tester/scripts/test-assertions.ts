import { evaluateAssertion } from "../src/evaluation/evaluate-assertion.js";
import type { ConversationResult } from "../src/simulation/conversation-runner.js";

function fakeResult(): ConversationResult {
  return {
    turns: [
      { turnNumber: 1, role: "caller", content: "Hi, I'd like to book a cleaning." },
      { turnNumber: 2, role: "agent", content: "Sure! What day works for you?", latencyMs: 1200 },
      { turnNumber: 3, role: "caller", content: "Next Tuesday." },
      { turnNumber: 4, role: "agent", content: "Booked for next Tuesday.", latencyMs: 900, toolCalls: [{ name: "book_appointment", args: { date: "next Tuesday" } }] },
    ],
    totalLatencyMs: 2100,
    endedReason: "goal_or_script_complete",
  };
}

async function check(name: string, actual: boolean, expected: boolean) {
  console.log(`${actual === expected ? "✅" : "❌"} ${name} — expected ${expected}, got ${actual}`);
}

async function main() {
  const result = fakeResult();
  await check("TOOL_CALLED matches", (await evaluateAssertion({ type: "TOOL_CALLED", toolName: "book_appointment" }, result)).passed, true);
  await check("TOOL_NOT_CALLED (never transferred)", (await evaluateAssertion({ type: "TOOL_NOT_CALLED", toolName: "transfer_to_human" }, result)).passed, true);
  await check("NOT_CONTAINS_KEYWORD (no price quoted)", (await evaluateAssertion({ type: "NOT_CONTAINS_KEYWORD", keywords: ["$", "price"], role: "agent" }, result)).passed, true);
  await check("MAX_LATENCY_MS (should FAIL — one turn hit 1200ms)", (await evaluateAssertion({ type: "MAX_LATENCY_MS", maxPerTurn: 1000 }, result)).passed, false);
  await check("MAX_TURNS (should FAIL — 2 agent turns, limit 1)", (await evaluateAssertion({ type: "MAX_TURNS", max: 1 }, result)).passed, false);
}
main();