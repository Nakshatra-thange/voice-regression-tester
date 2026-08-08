import { ReferenceHttpAdapter } from "../src/adapters/reference-http-adapter.js";

async function main() {
  const adapter = new ReferenceHttpAdapter("http://localhost:4001");
  const turn = await adapter.sendTurn({ history: [], callerUtterance: "Hi, is anyone there?" });
  console.log("Content:", turn.content);
  console.log("Tool calls:", turn.toolCalls);
  console.log("Latency:", turn.latencyMs, "ms");
}
main();