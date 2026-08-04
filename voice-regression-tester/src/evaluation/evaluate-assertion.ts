// src/evaluation/evaluate-assertion.ts
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import type { AssertionConfig } from "../lib/assertions.js";
import type { ConversationResult, RecordedTurn } from "../simulation/conversation-runner.js";
import type { AssertionEvalResult } from "./types.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

function turnsForRole(turns: RecordedTurn[], role: "agent" | "caller" | "any"): RecordedTurn[] {
  return role === "any" ? turns : turns.filter((t) => t.role === role);
}
function fullText(turns: RecordedTurn[]): string {
  return turns.map((t) => t.content).join("\n");
}

export async function evaluateAssertion(config: AssertionConfig, result: ConversationResult): Promise<AssertionEvalResult> {
  switch (config.type) {
    case "CONTAINS_KEYWORD": {
      const text = fullText(turnsForRole(result.turns, config.role));
      const haystack = config.caseSensitive ? text : text.toLowerCase();
      const hits = config.keywords.map((kw) => haystack.includes(config.caseSensitive ? kw : kw.toLowerCase()));
      const passed = config.matchAll ? hits.every(Boolean) : hits.some(Boolean);
      return {
        passed,
        actualValue: config.keywords.filter((_, i) => hits[i]).join(", ") || "(none found)",
        message: passed ? undefined : `Expected ${config.matchAll ? "all" : "any"} of [${config.keywords.join(", ")}]`,
      } as any;
    }

    case "NOT_CONTAINS_KEYWORD": {
      const text = fullText(turnsForRole(result.turns, config.role)).toLowerCase();
      const found = config.keywords.filter((kw) => text.includes(kw.toLowerCase()));
      return { passed: found.length === 0, actualValue: found.join(", ") || "(none found)", message: found.length ? `Found forbidden keyword(s): ${found.join(", ")}` : undefined } as any;
    }

    case "REGEX_MATCH": {
      const text = fullText(turnsForRole(result.turns, config.role));
      const match = new RegExp(config.pattern, config.flags).exec(text);
      return { passed: match !== null, actualValue: match?.[0], message: match ? undefined : `Pattern /${config.pattern}/${config.flags ?? ""} did not match` } as any;
    }

    case "TOOL_CALLED": {
      const calls = result.turns.flatMap((t) => t.toolCalls ?? []);
      const match = calls.find((c) => c.name === config.toolName && (!config.argsMatch || Object.entries(config.argsMatch).every(([k, v]) => c.args[k] === v)));
      return { passed: !!match, actualValue: match ? JSON.stringify(match.args) : undefined, message: match ? undefined : `Tool "${config.toolName}" was not called${config.argsMatch ? " with expected args" : ""}` } as any;
    }

    case "TOOL_NOT_CALLED": {
      const calls = result.turns.flatMap((t) => t.toolCalls ?? []);
      const match = calls.find((c) => c.name === config.toolName);
      return { passed: !match, actualValue: match ? JSON.stringify(match.args) : undefined, message: match ? `Tool "${config.toolName}" was unexpectedly called` : undefined }as any;
    }

    case "MAX_TURNS": {
      const exchanges = result.turns.filter((t) => t.role === "agent").length;
      return { passed: exchanges <= config.max, actualValue: String(exchanges), message: exchanges > config.max ? `Took ${exchanges} turns, expected ≤ ${config.max}` : undefined } as any;
    }

    case "MAX_LATENCY_MS": {
      const agentTurns = result.turns.filter((t) => t.role === "agent");
      const worstTurn = Math.max(...agentTurns.map((t) => t.latencyMs ?? 0), 0);
      const passed = (config.maxPerTurn == null || worstTurn <= config.maxPerTurn) && (config.maxTotal == null || result.totalLatencyMs <= config.maxTotal);
      return { passed, actualValue: `worstTurn=${worstTurn}ms, total=${result.totalLatencyMs}ms`, message: passed ? undefined : "Latency exceeded configured threshold" } as any;
    }

    case "LLM_JUDGE": {
      const transcript = result.turns.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join("\n");
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 300,
        system: `You are a strict QA evaluator for phone AI transcripts. Respond ONLY with JSON: {"score": number between 0 and 1, "reasoning": string}. No other text.`,
        messages: [{ role: "user", content: `Criteria: ${config.criteria}\n\nTranscript:\n${transcript}` }],
      });
      const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const score = Number(parsed.score ?? 0);
      return { passed: score >= config.passThreshold, actualValue: `score=${score}`, message: parsed.reasoning };
    }
  }
}