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
    const hash = typeof parsed.hash === "string" ? parsed.hash : null;
    return {
      ok: parsed.ok === true && typeof hash === "string" && hash.length > 0,
      runtime: parsed.runtime ?? null,
      hash,
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

const hashes = Object.values(runtimes)
  .filter((entry) => entry.ok && typeof entry.hash === "string")
  .map((entry) => entry.hash);

const allRuntimesOk = Object.values(runtimes).every((entry) => entry.ok === true);
const uniqueHashes = Array.from(new Set(hashes));
const crossRuntimeOk = allRuntimesOk && uniqueHashes.length === 1;

const report = {
  suite: "cross-runtime-determinism",
  timestamp: new Date().toISOString(),
  ok: crossRuntimeOk,
  runtimes,
  crossRuntime: {
    ok: crossRuntimeOk,
    requiredRuntimes: ["node", "deno", "bun"],
    observedHashes: {
      node: runtimes.node.ok ? runtimes.node.hash : null,
      deno: runtimes.deno.ok ? runtimes.deno.hash : null,
      bun: runtimes.bun.ok ? runtimes.bun.hash : null
    },
    uniqueHashCount: uniqueHashes.length
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
