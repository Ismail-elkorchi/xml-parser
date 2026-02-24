import fs from "node:fs/promises";

const reportPath = new URL("../../reports/governance-baseline.json", import.meta.url);

const requiredFiles = [
  ".github/workflows/ci.yml",
  ".github/workflows/codeql.yml",
  ".github/workflows/dependency-review.yml",
  ".github/workflows/scorecards.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "CONTRIBUTING.md"
];

const missing = [];
for (const file of requiredFiles) {
  try {
    await fs.access(new URL(`../../${file}`, import.meta.url));
  } catch {
    missing.push(file);
  }
}

const ok = missing.length === 0;
const report = {
  suite: "governance-baseline",
  timestamp: new Date().toISOString(),
  ok,
  missing
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Governance baseline check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
