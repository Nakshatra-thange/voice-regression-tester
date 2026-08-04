// src/simulation/factory.ts
import type { TestCase } from "../generated/prisma/client.js";
import type { CallerSimulator } from "./types.js";
import { ScriptedCaller } from "./scripted-caller.js";
import { GoalDrivenCaller } from "./goal-driven-caller.js";
import { ScriptedTurnsSchema } from "../lib/assertions.js";

export function buildCallerSimulator(testCase: TestCase): CallerSimulator {
  if (testCase.mode === "SCRIPTED") {
    return new ScriptedCaller(ScriptedTurnsSchema.parse(testCase.scriptedTurns));
  }
  if (!testCase.goal) throw new Error(`TestCase ${testCase.id} is GOAL_DRIVEN but has no goal set`);
  return new GoalDrivenCaller(testCase.personaPrompt, testCase.goal);
}