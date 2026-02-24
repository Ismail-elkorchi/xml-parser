import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const reportsDir = new URL("../../reports/", import.meta.url);

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
run("node", ["scripts/eval/check-governance-baseline.mjs"]);
run("node", ["scripts/eval/check-no-runtime-deps.mjs"]);
run("node", ["scripts/eval/check-no-node-builtins.mjs"]);
run("node", ["scripts/eval/check-scope-threat-model.mjs"]);
run("node", ["scripts/eval/check-parse-error-taxonomy.mjs"]);
run("node", ["scripts/eval/check-tokenizer-determinism.mjs"]);
run("node", ["scripts/eval/check-conformance-fixtures.mjs"]);
run("node", ["scripts/eval/check-query-layer.mjs"]);
run("node", ["scripts/eval/check-tree-namespace.mjs"]);
run("node", ["scripts/eval/check-stream-budgets.mjs"]);
run("node", ["scripts/eval/check-security-adversarial.mjs"]);
run("node", ["scripts/eval/check-serializer-determinism.mjs"]);
run("node", ["scripts/eval/check-integration-reliability.mjs"]);
run("node", ["scripts/eval/check-performance-complexity.mjs"]);
if (profile === "release") {
  run("node", ["scripts/eval/check-independent-oracle.mjs"]);
  run("node", ["scripts/eval/check-release-readiness.mjs"]);
}
run("node", ["scripts/eval/check-gates.mjs", `--profile=${profile}`]);

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
    "tree-namespace",
    "stream-budgets",
    "security-adversarial",
    "serializer-determinism",
    "integration-reliability",
    "performance-complexity",
    ...(profile === "release" ? ["oracle-independent", "release-readiness"] : []),
    "gates"
  ]
};
await fs.writeFile(new URL("../../reports/eval-summary.json", import.meta.url), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`evaluation complete: profile=${profile} ok=true`);
