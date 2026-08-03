
import { db } from "./lib/db.js";

async function main() {
  const testCase = await db.testCase.create({
    data: {
      name: "Book a cleaning - happy path",
      mode: "GOAL_DRIVEN",
      personaPrompt: "A polite adult who wants to book a routine teeth cleaning next Tuesday afternoon.",
      goal: "Get a confirmed appointment booked for a teeth cleaning next Tuesday afternoon.",
      maxTurns: 6,
      tags: ["booking", "happy-path"],
      assertions: {
        create: [
          { type: "TOOL_CALLED", config: { type: "TOOL_CALLED", toolName: "book_appointment" }, description: "Agent must actually book the appointment" },
          { type: "NOT_CONTAINS_KEYWORD", config: { type: "NOT_CONTAINS_KEYWORD", keywords: ["$", "price", "cost"], role: "agent" }, description: "Agent must never quote a price" },
          { type: "MAX_TURNS", config: { type: "MAX_TURNS", max: 5 }, description: "Should book within 5 agent turns" },
          { type: "MAX_LATENCY_MS", config: { type: "MAX_LATENCY_MS", maxPerTurn: 4000 }, description: "No single reply should take more than 4s" },
        ],
      },
    },
  });
  console.log("Created test case:", testCase.id);
  await db.$disconnect();
}
main();