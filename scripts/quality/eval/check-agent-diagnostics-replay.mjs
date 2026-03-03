import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const reportPath = new URL("../../../reports/agent-diagnostics-replay.json", import.meta.url);
const docPath = new URL("../../../docs/agent-diagnostics-replay.md", import.meta.url);
const modPath = new URL("../../../dist/mod.js", import.meta.url);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return {
      ok: false,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      status: result.status ?? 1
    };
  }

  const lines = (result.stdout ?? "").trim().split("\n");
  const jsonLine = lines.at(-1);
  if (!jsonLine) {
    return {
      ok: false,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      status: 1
    };
  }

  return {
    ok: true,
    payload: JSON.parse(jsonLine)
  };
}

function runFixture(fixture) {
  return {
    node: run("node", ["scripts/smoke/runtime-replay.mjs", `--fixture=${fixture}`]),
    deno: run("deno", ["run", "--allow-read=dist,scripts", "scripts/smoke/runtime-replay.mjs", `--fixture=${fixture}`]),
    bun: run("bun", ["scripts/smoke/runtime-replay.mjs", `--fixture=${fixture}`])
  };
}

function hashesMatch(results) {
  const payloads = Object.values(results)
    .filter((entry) => entry.ok)
    .map((entry) => entry.payload.replayHash);
  if (payloads.length !== 3) {
    return false;
  }
  return payloads.every((entry) => entry === payloads[0]);
}

const validResults = runFixture("valid");
const malformedResults = runFixture("malformed");

const allRunsOk = [...Object.values(validResults), ...Object.values(malformedResults)].every((entry) => entry.ok);

let docsPresent = true;
try {
  await fs.access(docPath);
} catch {
  docsPresent = false;
}

const moduleApi = await import(modPath.href);
const exportsPresent =
  typeof moduleApi.createXmlReplayContract === "function" &&
  typeof moduleApi.verifyXmlReplayContract === "function";

const validKinds = new Set(
  allRunsOk ? validResults.node.payload.eventKinds : []
);
const malformedKinds = new Set(
  allRunsOk ? malformedResults.node.payload.eventKinds : []
);

const checks = {
  exportsPresent,
  docsPresent,
  runtimeCommandsOk: allRunsOk,
  validCrossRuntimeEqual: allRunsOk && hashesMatch(validResults),
  malformedCrossRuntimeEqual: allRunsOk && hashesMatch(malformedResults),
  validIncludesToken: allRunsOk && validKinds.has("token"),
  validIncludesTreeNode: allRunsOk && validKinds.has("tree-node"),
  validIncludesSummary: allRunsOk && validKinds.has("summary"),
  malformedIncludesParseError: allRunsOk && malformedKinds.has("parse-error")
};

const ok = Object.values(checks).every((value) => value === true);

const report = {
  suite: "agent-diagnostics-replay",
  timestamp: new Date().toISOString(),
  ok,
  checks,
  runtimes: {
    valid: {
      node: validResults.node.ok ? validResults.node.payload : validResults.node,
      deno: validResults.deno.ok ? validResults.deno.payload : validResults.deno,
      bun: validResults.bun.ok ? validResults.bun.payload : validResults.bun
    },
    malformed: {
      node: malformedResults.node.ok ? malformedResults.node.payload : malformedResults.node,
      deno: malformedResults.deno.ok ? malformedResults.deno.payload : malformedResults.deno,
      bun: malformedResults.bun.ok ? malformedResults.bun.payload : malformedResults.bun
    }
  }
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Agent diagnostics replay check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
