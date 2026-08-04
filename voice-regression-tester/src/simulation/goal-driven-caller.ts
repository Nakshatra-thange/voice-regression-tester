
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import type { CallerSimulator } from "./types.js";
import type { ConversationTurn } from "../adapters/types.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

const END_CALL_TOOL: Anthropic.Tool = {
  name: "end_call",
  description: "Call this when your goal is achieved, or you've clearly failed/given up and would hang up.",
  input_schema: { type: "object", properties: { reason: { type: "string" } } },
};

export class GoalDrivenCaller implements CallerSimulator {
  private done = false;
  constructor(private personaPrompt: string, private goal: string) {}

  async nextUtterance(history: ConversationTurn[], _lastAgentReply: string | null): Promise<string | null> {
    if (this.done) return null;

    const systemPrompt = `You are roleplaying as a phone caller testing a voice AI agent.
Persona: ${this.personaPrompt}
Your goal for this call: ${this.goal}
Speak naturally, one short conversational turn at a time, like a real caller on the phone.
Never break character or mention you are an AI or a test.
Call end_call once your goal is achieved, or if you'd realistically give up and hang up.`;

    // From this LLM's own point of view: its past speech = "assistant", agent's replies = "user".
    const messages: Anthropic.MessageParam[] = history.map((t) => ({
      role: t.role === "caller" ? ("assistant" as const) : ("user" as const),
      content: t.content,
    }));
    if (messages.length === 0) {
      messages.push({ role: "user", content: "(The phone starts ringing. Say your opening line.)" });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: systemPrompt,
      tools: [END_CALL_TOOL],
      messages,
    });

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
      if (block.type === "tool_use" && block.name === "end_call") this.done = true;
    }

    return this.done && !text.trim() ? null : text.trim() || null;
  }
}