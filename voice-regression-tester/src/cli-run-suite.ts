
import { db } from "./lib/db.js";
import { runSuite } from "./run-suite.js";

async function main() {
  const agent = await db.agent.findFirstOrThrow({ where: { name: "Reference Booking Agent" } });
  const configVersion = process.argv[2] ?? `manual-${Date.now()}`;
  const tag = process.argv[3];

  const summary = await runSuite({ agentId: agent.id, configVersion, tag }as any);
  process.exit(summary.failed > 0 || summary.errored > 0 ? 1 : 0);
}
main();