// src/baselines/diff-runs.ts
import { diffWords } from "diff";
import { db } from "../lib/db.js";
import type { RunDiff, AssertionDiff, TurnDiff } from "./types.js";

async function loadFullRun(testRunId: string) {
  return db.testRun.findUniqueOrThrow({
    where: { id: testRunId },
    include: { turns: { orderBy: { turnNumber: "asc" } }, assertionResults: { include: { assertion: true } } },
  });
}

export async function diffAgainstBaseline(currentRunId: string): Promise<RunDiff | null> {
  const current = await loadFullRun(currentRunId);

  const baseline = await db.testRun.findFirst({
    where: { testCaseId: current.testCaseId, agentId: current.agentId, isBaseline: true, id: { not: current.id } },
    include: { turns: { orderBy: { turnNumber: "asc" } }, assertionResults: { include: { assertion: true } } },
  });

  if (!baseline) return null; // nothing to diff yet — caller should probably promote this run to baseline

  const baselineByAssertion = new Map(baseline.assertionResults.map((r) => [r.assertionId, r]));
  const assertionDiffs: AssertionDiff[] = current.assertionResults.map((cur) => {
    const base = baselineByAssertion.get(cur.assertionId);
    const baselinePassed = base?.passed ?? true;
    const status: AssertionDiff["status"] =
      baselinePassed === cur.passed ? "unchanged" : cur.passed ? "fixed" : "regressed";
    return {
      assertionId: cur.assertionId,
      description: cur.assertion.description,
      baselinePassed,
      currentPassed: cur.passed,
      status,
      baselineValue: base?.actualValue,
      currentValue: cur.actualValue,
    };
  });

  const baselineByTurn = new Map(baseline.turns.map((t) => [t.turnNumber, t]));
  const maxTurns = Math.max(baseline.turns.length, current.turns.length);
  const turnDiffs: TurnDiff[] = [];
  for (let i = 1; i <= maxTurns; i++) {
    const baseTurn = baselineByTurn.get(i);
    const curTurn = current.turns.find((t) => t.turnNumber === i);
    if (!baseTurn && !curTurn) continue;

    const changed = baseTurn?.content !== curTurn?.content;
    turnDiffs.push({
      turnNumber: i,
      role: (curTurn ?? baseTurn)!.role,
      baselineContent: baseTurn?.content,
      currentContent: curTurn?.content,
      changed,
      wordDiff: changed && baseTurn && curTurn ? diffWords(baseTurn.content, curTurn.content) : undefined,
    } as any);
  }

  return {
    testCaseId: current.testCaseId,
    agentId: current.agentId,
    baselineRunId: baseline.id,
    currentRunId: current.id,
    overallStatusChanged: baseline.status !== current.status,
    baselineStatus: baseline.status,
    currentStatus: current.status,
    assertionDiffs,
    turnDiffs,
    latencyDeltaMs: (current.totalLatencyMs ?? 0) - (baseline.totalLatencyMs ?? 0),
    turnCountDelta: current.turns.length - baseline.turns.length,
  };
}