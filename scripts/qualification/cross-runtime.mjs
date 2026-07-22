import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const reportPath = new URL("../../reports/cross-runtime-determinism.json", import.meta.url);

function runRuntime(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    return {
      ok: false,
      error: result.stderr || result.stdout || `exit-${String(result.status ?? "unknown")}`
    };
  }

  const lines = `${result.stdout ?? ""}`
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const jsonLine = lines.findLast((line) => line.startsWith("{") && line.endsWith("}"));
  if (!jsonLine) {
    return {
      ok: false,
      error: "missing-json-output"
    };
  }

  try {
    const parsed = JSON.parse(jsonLine);
    const snapshot = parsed.snapshot && typeof parsed.snapshot === "object" ? parsed.snapshot : null;
    return {
      ok: parsed.ok === true && snapshot !== null,
      runtime: parsed.runtime ?? null,
      snapshot,
      root: parsed.root ?? null,
      tokenCount: parsed.tokenCount ?? null
    };
  } catch {
    return {
      ok: false,
      error: "invalid-json-output"
    };
  }
}

const runtimes = {
  node: runRuntime("node", ["scripts/smoke/runtime-smoke.mjs"]),
  deno: runRuntime("deno", ["run", "--allow-read", "scripts/smoke/runtime-smoke.mjs"]),
  bun: runRuntime("bun", ["scripts/smoke/runtime-smoke.mjs"])
};

const snapshots = Object.values(runtimes)
  .filter((entry) => entry.ok && entry.snapshot !== null)
  .map((entry) => JSON.stringify(entry.snapshot));

const allRuntimesOk = Object.values(runtimes).every((entry) => entry.ok === true);
const uniqueSnapshots = Array.from(new Set(snapshots));
const crossRuntimeOk = allRuntimesOk && uniqueSnapshots.length === 1;

const report = {
  suite: "cross-runtime-determinism",
  timestamp: new Date().toISOString(),
  ok: crossRuntimeOk,
  runtimes,
  crossRuntime: {
    ok: crossRuntimeOk,
    requiredRuntimes: ["node", "deno", "bun"],
    observedSnapshots: {
      node: runtimes.node.ok ? runtimes.node.snapshot : null,
      deno: runtimes.deno.ok ? runtimes.deno.snapshot : null,
      bun: runtimes.bun.ok ? runtimes.bun.snapshot : null
    },
    uniqueSnapshotCount: uniqueSnapshots.length
  },
  overall: {
    ok: crossRuntimeOk
  }
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!crossRuntimeOk) {
  console.error("cross-runtime determinism check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
