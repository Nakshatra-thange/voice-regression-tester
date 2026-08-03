
import { db } from "./lib/db.js";

async function main() {
  const agent = await db.agent.create({
    data: { name: "Reference Booking Agent", baseUrl: "http://localhost:4000" },
  });
  console.log("Connected. Created agent:", agent);
  await db.$disconnect();
}

main();