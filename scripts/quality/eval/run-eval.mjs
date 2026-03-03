import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const reportsDir = new URL("../../../reports/", import.meta.url);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function cleanReports() {
  try {
    const entries = await fs.readdir(reportsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".gitkeep") {
        continue;
      }
      await fs.rm(new URL(entry.name, reportsDir), { recursive: true, force: true });
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await fs.mkdir(reportsDir, { recursive: true });
      await fs.writeFile(new URL(".gitkeep", reportsDir), "", "utf8");
      return;
    }
    throw error;
  }
}

const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const profile = profileArg ? profileArg.split("=")[1] : "ci";

await cleanReports();

run("npm", ["run", "build"]);
run("node", ["examples/run-all.mjs"]);
run("node", ["scripts/quality/eval/check-governance-baseline.mjs"]);
run("node", ["scripts/quality/eval/check-no-runtime-deps.mjs"]);
run("node", ["scripts/quality/eval/check-no-node-builtins.mjs"]);
run("node", ["scripts/quality/eval/check-scope-threat-model.mjs"]);
run("node", ["scripts/quality/eval/check-parse-error-taxonomy.mjs"]);
run("node", ["scripts/quality/eval/check-tokenizer-determinism.mjs"]);
run("node", ["scripts/quality/eval/check-conformance-fixtures.mjs"]);
run("node", ["scripts/quality/eval/check-query-layer.mjs"]);
run("node", ["scripts/quality/eval/check-schema-validation.mjs"]);
run("node", ["scripts/quality/eval/check-canonical-signature.mjs"]);
run("node", ["scripts/quality/eval/check-agent-diagnostics-replay.mjs"]);
run("node", ["scripts/quality/eval/check-tree-namespace.mjs"]);
run("node", ["scripts/quality/eval/check-stream-budgets.mjs"]);
run("node", ["scripts/quality/eval/check-security-adversarial.mjs"]);
run("node", ["scripts/quality/eval/check-serializer-determinism.mjs"]);
run("node", ["scripts/quality/eval/check-integration-reliability.mjs"]);
run("node", ["scripts/quality/eval/check-browser-smoke.mjs"]);
run("node", ["scripts/quality/eval/check-cross-runtime-determinism.mjs"]);
run("node", ["scripts/quality/eval/check-performance-complexity.mjs"]);
if (profile === "release") {
  run("node", ["scripts/quality/eval/check-security-evidence.mjs"]);
  run("node", ["scripts/quality/eval/check-independent-oracle.mjs"]);
  run("node", ["scripts/quality/eval/check-release-readiness.mjs"]);
}
run("node", ["scripts/quality/eval/check-gates.mjs", `--profile=${profile}`]);

const summary = {
  suite: "eval-summary",
  timestamp: new Date().toISOString(),
  profile,
  ok: true,
  reports: [
    "governance-baseline",
    "no-runtime-deps",
    "no-node-builtins",
    "scope-threat-model",
    "parse-error-taxonomy",
    "tokenizer-determinism",
    "conformance-fixtures",
    "query-layer",
    "schema-validation",
    "canonical-signature",
    "agent-diagnostics-replay",
    "tree-namespace",
    "stream-budgets",
    "security-adversarial",
    "serializer-determinism",
    "integration-reliability",
    "browser-smoke",
    "cross-runtime-determinism",
    "performance-complexity",
    ...(profile === "release" ? ["security-evidence", "oracle-independent", "release-readiness"] : []),
    "gates"
  ]
};
await fs.writeFile(new URL("../../../reports/eval-summary.json", import.meta.url), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`evaluation complete: profile=${profile} ok=true`);
