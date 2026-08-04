
import type { RunDiff } from "./types.js";

export function printDiff(diff: RunDiff) {
  console.log(`\n=== Diff vs baseline ===`);
  console.log(`Baseline: ${diff.baselineRunId} (${diff.baselineStatus})  →  Current: ${diff.currentRunId} (${diff.currentStatus})`);
  if (diff.overallStatusChanged) console.log(`⚠️  Overall status changed: ${diff.baselineStatus} → ${diff.currentStatus}`);
  console.log(`Latency delta: ${diff.latencyDeltaMs >= 0 ? "+" : ""}${diff.latencyDeltaMs}ms | Turn count delta: ${diff.turnCountDelta >= 0 ? "+" : ""}${diff.turnCountDelta}`);

  console.log(`\n--- Assertions ---`);
  for (const a of diff.assertionDiffs) {
    const icon = a.status === "regressed" ? "🔴" : a.status === "fixed" ? "🟢" : "⚪️";
    console.log(`${icon} [${a.status}] ${a.description ?? a.assertionId}`);
    if (a.status !== "unchanged") console.log(`   baseline: ${a.baselineValue ?? "-"} → current: ${a.currentValue ?? "-"}`);
  }

  const changedTurns = diff.turnDiffs.filter((t) => t.changed);
  if (changedTurns.length) {
    console.log(`\n--- Changed turns (${changedTurns.length}) ---`);
    for (const t of changedTurns) {
      console.log(`\nTurn ${t.turnNumber} [${t.role}]:`);
      if (t.wordDiff) {
        console.log("  " + t.wordDiff.map((p) => (p.added ? `+${p.value}+` : p.removed ? `-${p.value}-` : p.value)).join(""));
      } else {
        console.log(`  baseline: ${t.baselineContent ?? "(missing)"}`);
        console.log(`  current:  ${t.currentContent ?? "(missing)"}`);
      }
    }
  }
}