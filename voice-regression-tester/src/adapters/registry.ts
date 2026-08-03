
import type { Agent } from "../generated/prisma/client.js";
import type { AgentAdapter } from "./types.js";
import { ReferenceHttpAdapter } from "./reference-http-adapter.js";
import { GenericJsonAdapter, type GenericJsonAdapterConfig } from "./generic-json-adapter.js";

export function getAdapterForAgent(agent: Agent): AgentAdapter {
  switch (agent.adapterType) {
    case "reference_http":
      return new ReferenceHttpAdapter(agent.baseUrl, agent.authHeader ?? undefined);

    case "generic_json": {
      const cfg = agent.requestConfig as unknown as Omit<GenericJsonAdapterConfig, "authHeader" | "endpoint">;
      return new GenericJsonAdapter({
        ...cfg,
        endpoint: agent.baseUrl,
        authHeader: agent.authHeader ?? undefined,
      } as any);
    }

    default:
      throw new Error(`Unknown adapterType "${agent.adapterType}" for agent ${agent.id}`);
  }
}