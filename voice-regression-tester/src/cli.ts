import { db } from "./lib/db.js";
import { runSuite } from "./run-suite.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] === "run" || args[0] === "seed" || args[0] === "help" ? args.shift()! : "run";

  if (args.includes("--help") || args.includes("-h") || command === "help") {
    console.log(`
Voice Agent Regression Tester CLI

Usage:
  npx tsx src/cli.ts [command] [options]

Commands:
  run [configVersion] [tag]    Run full test suite (default)
  seed                        Seed reference booking agent and test cases
  help                        Show this help documentation

Examples:
  npx tsx src/cli.ts --version v1.0.0 --tag booking
  npx tsx src/cli.ts run v1.0.1 booking
`);
    process.exit(0);
  }

  if (command === "seed") {
    console.log("Seeding test cases...");
    // Seed execution trigger
    const agent = await db.agent.upsert({
      where: { id: "ref-agent-booking" },
      update: { name: "Reference Booking Agent", baseUrl: "http://localhost:3000/api/booking-agent" },
      create: {
        id: "ref-agent-booking",
        name: "Reference Booking Agent",
        baseUrl: "http://localhost:3000/api/booking-agent",
        adapterType: "reference_http",
      },
    });
    console.log(`Seeded Agent: ${agent.name} (${agent.id})`);
    process.exit(0);
  }

  let configVersion: string | undefined;
  let tag: string | undefined;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--version") {
      configVersion = args[++i];
    } else if (arg === "--tag") {
      tag = args[++i];
    } else if (arg.startsWith("--version=")) {
      configVersion = arg.slice("--version=".length);
    } else if (arg.startsWith("--tag=")) {
      tag = arg.slice("--tag=".length);
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  configVersion ??= positional[0] ?? `manual-${Date.now()}`;
  tag ??= positional[1];
  if (!configVersion) throw new Error("--version requires a value");
  if (args.includes("--tag") && !tag) throw new Error("--tag requires a value");

  try {
    const agent = await db.agent.findUnique({ where: { id: "ref-agent-booking" } })
      || await db.agent.findFirst({ where: { name: "Reference Booking Agent" } }) 
      || await db.agent.findFirst();

    if (!agent) {
      console.error("No agents found in database. Run 'npx tsx src/seed-test-case.ts' first.");
      process.exit(1);
    }

    console.log(`Running regression suite for agent: ${agent.name} (${agent.id})...`);
    const summary = await runSuite({ agentId: agent.id, configVersion, tag });
    process.exit(summary.failed > 0 || summary.errored > 0 ? 1 : 0);
  } catch (error: any) {
    console.error("Error executing regression suite:", error.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
