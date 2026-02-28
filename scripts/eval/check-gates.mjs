import fs from "node:fs/promises";

const reportPath = new URL("../../reports/gates.json", import.meta.url);
const configPath = new URL("../../evaluation.config.json", import.meta.url);

const config = JSON.parse(await fs.readFile(configPath, "utf8"));

const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const profile = profileArg ? profileArg.split("=")[1] : "ci";

const required = config.profiles?.[profile]?.requiredReports ?? [];
const gateMap = config.gateMap ?? {};
const checks = [];
const reportProducerMap = {
  "governance-baseline": "scripts/eval/check-governance-baseline.mjs",
  "no-runtime-deps": "scripts/eval/check-no-runtime-deps.mjs",
  "no-node-builtins": "scripts/eval/check-no-node-builtins.mjs",
  "scope-threat-model": "scripts/eval/check-scope-threat-model.mjs",
  "parse-error-taxonomy": "scripts/eval/check-parse-error-taxonomy.mjs",
  "tokenizer-determinism": "scripts/eval/check-tokenizer-determinism.mjs",
  "conformance-fixtures": "scripts/eval/check-conformance-fixtures.mjs",
  "query-layer": "scripts/eval/check-query-layer.mjs",
  "schema-validation": "scripts/eval/check-schema-validation.mjs",
  "canonical-signature": "scripts/eval/check-canonical-signature.mjs",
  "agent-diagnostics-replay": "scripts/eval/check-agent-diagnostics-replay.mjs",
  "tree-namespace": "scripts/eval/check-tree-namespace.mjs",
  "stream-budgets": "scripts/eval/check-stream-budgets.mjs",
  "security-adversarial": "scripts/eval/check-security-adversarial.mjs",
  "security-evidence": "scripts/eval/check-security-evidence.mjs",
  "serializer-determinism": "scripts/eval/check-serializer-determinism.mjs",
  "integration-reliability": "scripts/eval/check-integration-reliability.mjs",
  "browser-smoke": "scripts/eval/check-browser-smoke.mjs",
  "performance-complexity": "scripts/eval/check-performance-complexity.mjs",
  "oracle-independent": "scripts/eval/check-independent-oracle.mjs",
  "release-readiness": "scripts/eval/check-release-readiness.mjs"
};

for (const name of required) {
  const checkPath = new URL(`../../reports/${name}.json`, import.meta.url);
  let ok = false;
  let details = "missing report";
  try {
    const body = JSON.parse(await fs.readFile(checkPath, "utf8"));
    ok = body.ok === true;
    details = ok ? "ok" : "report indicates failure";
  } catch {
    ok = false;
  }
  checks.push({
    gate: gateMap[name] ?? name,
    report: name,
    ok,
    details
  });
}

const missingGateMap = required.filter((name) => !(name in gateMap));
const missingProducerMap = required.filter((name) => !(name in reportProducerMap));
const missingProducerScripts = [];
for (const name of required) {
  const scriptPath = reportProducerMap[name];
  if (!scriptPath) {
    continue;
  }
  try {
    await fs.access(new URL(`../../${scriptPath}`, import.meta.url));
  } catch {
    missingProducerScripts.push({ report: name, scriptPath });
  }
}

checks.push({
  gate: "G-129",
  report: "coherence",
  ok: missingGateMap.length === 0 && missingProducerMap.length === 0 && missingProducerScripts.length === 0,
  details:
    missingGateMap.length === 0 && missingProducerMap.length === 0 && missingProducerScripts.length === 0
      ? "ok"
      : JSON.stringify({
          missingGateMap,
          missingProducerMap,
          missingProducerScripts
        })
});

const overall = checks.every((check) => check.ok);
const output = {
  suite: "gates",
  timestamp: new Date().toISOString(),
  profile,
  ok: overall,
  checks
};

await fs.writeFile(reportPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

if (!overall) {
  console.error("Gate check failed", JSON.stringify(output, null, 2));
  process.exit(1);
}
