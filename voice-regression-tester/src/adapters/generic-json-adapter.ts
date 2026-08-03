
import type { AgentAdapter, AgentTurnRequest, AgentTurnResponse } from "./types.js";

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export interface GenericJsonAdapterConfig {
  endpoint: string;
  authHeader?: string;
  buildRequestBody: (req: AgentTurnRequest) => Record<string, unknown>;
  contentPath: string;
  toolCallsPath?: string;
  toolNameKey?: string;
  toolArgsKey?: string;
}

export class GenericJsonAdapter implements AgentAdapter {
  constructor(private config: GenericJsonAdapterConfig) {}

  async sendTurn(req: AgentTurnRequest): Promise<AgentTurnResponse> {
    const start = Date.now();
    const res = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.authHeader ? { Authorization: this.config.authHeader } : {}),
      },
      body: JSON.stringify(this.config.buildRequestBody(req)),
    });

    if (!res.ok) throw new Error(`Agent responded ${res.status}: ${await res.text()}`);

    const body = await res.json();
    const latencyMs = Date.now() - start;
    const content = String(getPath(body, this.config.contentPath) ?? "");
    const rawToolCalls = this.config.toolCallsPath
      ? ((getPath(body, this.config.toolCallsPath) as unknown[]) ?? [])
      : [];

    const nameKey = this.config.toolNameKey ?? "name";
    const argsKey = this.config.toolArgsKey ?? "args";

    const toolCalls = rawToolCalls.map((tc) => ({
      name: String((tc as Record<string, unknown>)[nameKey]),
      args: ((tc as Record<string, unknown>)[argsKey] ?? {}) as Record<string, unknown>,
    }));

    return { content, toolCalls, latencyMs, raw: body };
  }
}