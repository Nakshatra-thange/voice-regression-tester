// src/lib/assertions.ts — FULL UPDATED FILE (replace the Step 8 version)
import { z } from "zod";

const RoleFilter = z.enum(["agent", "caller", "any"]).default("agent");

export const AssertionConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CONTAINS_KEYWORD"),
    keywords: z.array(z.string()).min(1),
    matchAll: z.boolean().default(false),
    caseSensitive: z.boolean().default(false),
    role: RoleFilter,
  }),
  z.object({
    type: z.literal("NOT_CONTAINS_KEYWORD"),
    keywords: z.array(z.string()).min(1),
    role: RoleFilter,
  }),
  z.object({
    type: z.literal("REGEX_MATCH"),
    pattern: z.string(),
    flags: z.string().optional(),
    role: RoleFilter,
  }),
  z.object({
    type: z.literal("TOOL_CALLED"),
    toolName: z.string(),
    argsMatch: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    type: z.literal("TOOL_NOT_CALLED"),
    toolName: z.string(),
  }),
  z.object({
    type: z.literal("MAX_TURNS"),
    max: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("MAX_LATENCY_MS"),
    maxPerTurn: z.number().int().positive().optional(),
    maxTotal: z.number().int().positive().optional(),
  }),
  z.object({
    type: z.literal("LLM_JUDGE"),
    criteria: z.string(),
    passThreshold: z.number().min(0).max(1).default(0.7),
  }),
]);

export type AssertionConfig = z.infer<typeof AssertionConfigSchema>;
export const ScriptedTurnsSchema = z.array(z.string()).min(1);