// src/smoke-test.ts
import { db } from "./lib/db.js";
import { getAdapterForAgent } from "./adapters/registry.js";

async function main() {
  const agent = await db.agent.create({
    data: { name: "Reference Booking Agent", baseUrl: "http://localhost:4001", adapterType: "reference_http" },
  });

  const adapter = getAdapterForAgent(agent);
  const turn = await adapter.sendTurn({
    history: [],
    callerUtterance: "Hi, I'd like to book a teeth cleaning for next Tuesday.",
  });

  console.log("Agent:", turn.content);
  console.log("Tool calls:", turn.toolCalls);
  console.log("Latency:", turn.latencyMs, "ms");

  await db.$disconnect();
}

main();