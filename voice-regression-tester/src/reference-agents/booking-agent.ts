
import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatRequestBody, ChatResponseBody, ToolCall } from "./types.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

const SYSTEM_PROMPT = `You are a friendly front-desk phone assistant for "Bright Smile Dental".
Collect the caller's name, phone number, desired service, and a preferred date + time,
then call the book_appointment tool. Ask one question at a time. Keep replies short and natural,
like a real phone call. Never quote prices. If the caller explicitly asks for a human, call transfer_to_human.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "book_appointment",
    description: "Book a confirmed appointment once all required details are known.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        service: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
      },
      required: ["name", "phone", "service", "date", "time"],
    },
  },
  {
    name: "transfer_to_human",
    description: "Transfer the call to a human when the caller explicitly asks for one.",
    input_schema: { type: "object", properties: { reason: { type: "string" } } },
  },
];

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const body = req.body as ChatRequestBody;

  const messages: Anthropic.MessageParam[] = [
    ...body.history.map((t) => ({
      role: t.role === "caller" ? ("user" as const) : ("assistant" as const),
      content: t.content,
    })),
    { role: "user", content: body.callerUtterance },
  ];

  const start = Date.now();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages,
  });
  const latencyMs = Date.now() - start;

  let content = "";
  const toolCalls: ToolCall[] = [];
  for (const block of response.content) {
    if (block.type === "text") content += block.text;
    if (block.type === "tool_use") {
      toolCalls.push({ name: block.name, args: block.input as Record<string, unknown> });
    }
  }

  const result: ChatResponseBody = { content, toolCalls, latencyMs };
  res.json(result);
});
app.get("/health", (_req, res) => res.sendStatus(200));

app.listen(4001, () => console.log("Booking reference agent listening on :4001"));
