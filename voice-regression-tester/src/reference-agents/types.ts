
export interface ChatTurn {
    role: "caller" | "agent";
    content: string;
  }
  
  export interface ChatRequestBody {
    conversationId: string;
    history: ChatTurn[];
    callerUtterance: string;
  }
  
  export interface ToolCall {
    name: string;
    args: Record<string, unknown>;
  }
  
  export interface ChatResponseBody {
    content: string;
    toolCalls: ToolCall[];
    latencyMs: number;
  }