import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const reportPath = new URL("../../../reports/browser-smoke.json", import.meta.url);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    if (command === "node" && args[0] === "scripts/smoke/runtime-browser-smoke.mjs") {
      console.error("Browser smoke prerequisites missing. Run: npx playwright install chromium");
    }
    process.exit(result.status ?? 1);
  }
}

run("node", ["scripts/smoke/runtime-browser-smoke.mjs", "--report=reports/browser-smoke.json"]);

const report = JSON.parse(await fs.readFile(reportPath, "utf8"));

const checks = report?.checks && typeof report.checks === "object" ? report.checks : {};
const requiredChecks = [
  "exportsPresent",
  "parseXml",
  "parseXmlBytes",
  "parseXmlStream",
  "serializeXml",
  "tokenizeXml",
  "determinism",
  "roundtrip"
];
const requiredChecksOk = requiredChecks.every((key) => checks[key] === true);

const ok =
  report?.suite === "browser-smoke" &&
  report?.runtime === "browser" &&
  report?.ok === true &&
  typeof report?.version === "string" &&
  report.version.length > 0 &&
  typeof report?.determinismHash === "string" &&
  report.determinismHash.length > 0 &&
  requiredChecksOk;

const normalized = {
  suite: "browser-smoke",
  timestamp: new Date().toISOString(),
  ok,
  runtime: "browser",
  version: report?.version ?? null,
  userAgent: report?.userAgent ?? null,
  hash: report?.hash ?? null,
  determinismHash: report?.determinismHash ?? null,
  checks,
  requiredChecks,
  requiredChecksOk
};

await fs.writeFile(reportPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Browser smoke check failed", JSON.stringify(normalized, null, 2));
  process.exit(1);
}
