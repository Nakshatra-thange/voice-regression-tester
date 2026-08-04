
import type { ConversationTurn } from "../adapters/types.js";

export interface CallerSimulator {
  
  nextUtterance(history: ConversationTurn[], lastAgentReply: string | null): Promise<string | null>;
}