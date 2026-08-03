// src/simulation/scripted-caller.ts
import type { CallerSimulator } from "./types.js";
import type { ConversationTurn } from "../adapters/types.js";

export class ScriptedCaller implements CallerSimulator {
  private index = 0;
  constructor(private script: string[]) {}

  async nextUtterance(_history: ConversationTurn[], _lastAgentReply: string | null): Promise<string | null> {
    if (this.index >= this.script.length) return null;
    const utterance = this.script[this.index++];
    if (!utterance) return null;
    return utterance;
  }
}