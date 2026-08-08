import { ScriptedCaller } from "../src/simulation/scripted-caller.js";
import { GoalDrivenCaller } from "../src/simulation/goal-driven-caller.js";

async function main() {
  const scripted = new ScriptedCaller(["Hi there", "I'd like Tuesday please"]);
  console.log("Scripted 1:", await scripted.nextUtterance([], null));
  console.log("Scripted 2:", await scripted.nextUtterance([], null));
  console.log("Scripted 3 (should be null):", await scripted.nextUtterance([], null));

  const goalDriven = new GoalDrivenCaller(
    "A polite adult booking a teeth cleaning.",
    "Get a teeth cleaning booked for next Tuesday afternoon."
  );
  const opener = await goalDriven.nextUtterance([], null);
  console.log("Goal-driven opener:", opener);
}
main();