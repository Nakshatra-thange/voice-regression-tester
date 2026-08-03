// src/baselines/types.ts
export interface AssertionDiff {
    assertionId: string;
    description: string | null;
    baselinePassed: boolean;
    currentPassed: boolean;
    status: "unchanged" | "regressed" | "fixed";
    baselineValue?: string | null;
    currentValue?: string | null;
  }
  
  export interface TurnDiff {
    turnNumber: number;
    role: string;
    baselineContent?: string;
    currentContent?: string;
    changed: boolean;
    wordDiff?: Array<{ value: string; added?: boolean; removed?: boolean }>;
  }
  
  export interface RunDiff {
    testCaseId: string;
    agentId: string;
    baselineRunId: string;
    currentRunId: string;
    overallStatusChanged: boolean;
    baselineStatus: string;
    currentStatus: string;
    assertionDiffs: AssertionDiff[];
    turnDiffs: TurnDiff[];
    latencyDeltaMs: number;
    turnCountDelta: number;
  }