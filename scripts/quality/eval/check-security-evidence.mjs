import fs from "node:fs/promises";

const reportPath = new URL("../../../reports/security-evidence.json", import.meta.url);

async function fileExists(path) {
  try {
    await fs.access(new URL(`../../../${path}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
}

async function readReport(name) {
  const path = new URL(`../../../reports/${name}.json`, import.meta.url);
  const raw = await fs.readFile(path, "utf8");
  return JSON.parse(raw);
}

const checks = {};

checks.securityPolicyDoc = await fileExists("SECURITY.md");
checks.securityTriageDoc = await fileExists("docs/security-triage.md");

const codeqlWorkflowPath = new URL("../../../.github/workflows/codeql.yml", import.meta.url);
const codeqlWorkflowText = await fs.readFile(codeqlWorkflowPath, "utf8");
checks.codeqlSchedulePresent = /(^|\n)\s*schedule:\s*\n/m.test(codeqlWorkflowText);
checks.codeqlSecurityExtendedLane =
  /queries:\s*security-extended/.test(codeqlWorkflowText)
  && /category:\s*["']?\/language:javascript-typescript\/security-extended["']?/.test(codeqlWorkflowText);

let securityAdversarialOk = false;
let governanceBaselineOk = false;
try {
  securityAdversarialOk = (await readReport("security-adversarial")).ok === true;
} catch {
  securityAdversarialOk = false;
}
try {
  governanceBaselineOk = (await readReport("governance-baseline")).ok === true;
} catch {
  governanceBaselineOk = false;
}

checks.securityAdversarialReportOk = securityAdversarialOk;
checks.governanceBaselineReportOk = governanceBaselineOk;

const ok = Object.values(checks).every((value) => value === true);
const report = {
  suite: "security-evidence",
  timestamp: new Date().toISOString(),
  ok,
  checks
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("security evidence check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
