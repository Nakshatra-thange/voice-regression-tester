
export interface ConversationTurn {
    role: "caller" | "agent";
    content: string;
  }
  
  export interface AgentTurnRequest {
    history: ConversationTurn[];
    callerUtterance: string;
  }
  
  export interface AgentToolCall {
    name: string;
    args: Record<string, unknown>;
  }
  
  export interface AgentTurnResponse {
    content: string;
    toolCalls: AgentToolCall[];
    latencyMs: number;
    raw?: unknown;
  }
  
  export interface AgentAdapter {
    sendTurn(req: AgentTurnRequest): Promise<AgentTurnResponse>;
  }