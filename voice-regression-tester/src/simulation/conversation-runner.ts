
import type { TestCase } from "../generated/prisma/client.js";
import type { AgentAdapter, ConversationTurn, AgentToolCall } from "../adapters/types.js";
import { buildCallerSimulator } from "./factory.js";

export interface RecordedTurn {
  turnNumber: number;
  role: "caller" | "agent";
  content: string;
  toolCalls?: AgentToolCall[];
  latencyMs?: number;
}

export interface ConversationResult {
  turns: RecordedTurn[];
  totalLatencyMs: number;
  endedReason: "goal_or_script_complete" | "max_turns_reached" | "agent_error";
}

export async function runConversation(testCase: TestCase, adapter: AgentAdapter): Promise<ConversationResult> {
  const caller = buildCallerSimulator(testCase);
  const history: ConversationTurn[] = [];
  const turns: RecordedTurn[] = [];
  let totalLatencyMs = 0;
  let turnNumber = 0;
  let exchangeCount = 0;
  let lastAgentReply: string | null = null;

  while (exchangeCount < testCase.maxTurns) {
    const callerUtterance = await caller.nextUtterance(history, lastAgentReply);
    if (callerUtterance === null) return { turns, totalLatencyMs, endedReason: "goal_or_script_complete" };

    turnNumber++;
    turns.push({ turnNumber, role: "caller", content: callerUtterance });
    history.push({ role: "caller", content: callerUtterance });

    try {
      const agentTurn = await adapter.sendTurn({ history, callerUtterance });
      turnNumber++;
      turns.push({ turnNumber, role: "agent", content: agentTurn.content, toolCalls: agentTurn.toolCalls, latencyMs: agentTurn.latencyMs });
      history.push({ role: "agent", content: agentTurn.content });
      totalLatencyMs += agentTurn.latencyMs;
      lastAgentReply = agentTurn.content;
    } catch (err) {
      turnNumber++;
      turns.push({ turnNumber, role: "agent", content: `[ERROR: ${(err as Error).message}]` });
      return { turns, totalLatencyMs, endedReason: "agent_error" };
    }

    exchangeCount++;
  }

  return { turns, totalLatencyMs, endedReason: "max_turns_reached" };
}