
import { startTwiMLServer } from "./telephony/twiml-server.js";
import { db } from "./lib/db.js";
import { runTestCaseOverPhone } from "./run-test-case-voice.js";

async function main() {
  startTwiMLServer(4002);
  const testCase = await db.testCase.findFirstOrThrow({ where: { name: "Book a cleaning - happy path" } });
  const agent = await db.agent.findFirstOrThrow({ where: { name: "Reference Booking Agent" } });

  const run = await runTestCaseOverPhone(testCase.id, agent.id, process.env.TARGET_AGENT_PHONE_NUMBER!, "phone-smoke-test");
  console.log(`Phone test run ${run.id}: ${run.status}`);
  process.exit(0);
}
main();