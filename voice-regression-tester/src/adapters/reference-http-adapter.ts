

import type { AgentAdapter, AgentTurnRequest, AgentTurnResponse } from "./types.js";

export class ReferenceHttpAdapter implements AgentAdapter {
  constructor(private baseUrl: string, private authHeader?: string) {}

  async sendTurn(req: AgentTurnRequest): Promise<AgentTurnResponse> {
    const start = Date.now();
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.authHeader ? { Authorization: this.authHeader } : {}),
      },
      body: JSON.stringify({
        conversationId: "test-run",
        history: req.history,
        callerUtterance: req.callerUtterance,
      }),
    });

    if (!res.ok) throw new Error(`Agent responded ${res.status}: ${await res.text()}`);

    const body = await res.json();
    return {
      content: body.content,
      toolCalls: body.toolCalls ?? [],
      latencyMs: body.latencyMs ?? Date.now() - start,
      raw: body,
    };
  }
}