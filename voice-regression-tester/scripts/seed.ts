// scripts/seed.ts
import { db } from "../src/lib/db.js";

async function upsertAgent() {
  const existing = await db.agent.findFirst({ where: { name: "Reference Booking Agent" } });
  if (existing) return existing;
  return db.agent.create({
    data: { name: "Reference Booking Agent", baseUrl: "http://localhost:4001", adapterType: "reference_http" },
  });
}

async function upsertTestCase(input: Parameters<typeof db.testCase.create>[0]["data"] & { name: string }) {
  await db.testCase.deleteMany({ where: { name: input.name } }); // cascades to old assertions — keeps this script re-runnable
  return db.testCase.create({ data: input });
}

async function main() {
  const agent = await upsertAgent();
  console.log(`Agent ready: ${agent.id}`);

  await upsertTestCase({
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
  });

  await upsertTestCase({
    name: "Caller asks to speak to a human",
    mode: "SCRIPTED",
    personaPrompt: "A caller who quickly loses patience with automated systems.",
    scriptedTurns: ["Hi there", "Actually, I'd rather just talk to a real person, can you transfer me?"],
    maxTurns: 3,
    tags: ["booking", "escalation"],
    assertions: {
      create: [
        { type: "TOOL_CALLED", config: { type: "TOOL_CALLED", toolName: "transfer_to_human" }, description: "Agent must transfer when explicitly asked" },
        { type: "MAX_TURNS", config: { type: "MAX_TURNS", max: 3 }, description: "Should transfer promptly, not stall" },
      ],
    },
  });

  await upsertTestCase({
    name: "Caller never specifies which service",
    mode: "SCRIPTED",
    personaPrompt: "A vague caller who gives contact details but never says what they actually need.",
    scriptedTurns: ["Hi, I need an appointment please.", "Next Tuesday works for me.", "My name is Alex Rivera, phone is 555-0182."],
    maxTurns: 4,
    tags: ["booking", "edge-case"],
    assertions: {
      create: [
        { type: "TOOL_NOT_CALLED", config: { type: "TOOL_NOT_CALLED", toolName: "book_appointment" }, description: "Must not book without knowing the requested service" },
      ],
    },
  });

  await upsertTestCase({
    name: "Impatient caller wants the fastest possible booking",
    mode: "GOAL_DRIVEN",
    personaPrompt: "A terse, impatient caller who gives all their details upfront in one breath and hates repeating themselves.",
    goal: "Get a teeth cleaning booked for Wednesday morning in as few turns as possible.",
    maxTurns: 4,
    tags: ["booking", "edge-case"],
    assertions: {
      create: [
        { type: "TOOL_CALLED", config: { type: "TOOL_CALLED", toolName: "book_appointment" }, description: "Must still book successfully" },
        { type: "MAX_TURNS", config: { type: "MAX_TURNS", max: 3 }, description: "Should not over-ask when caller already gave everything" },
      ],
    },
  });

  console.log("Seeded 4 test cases.");
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});