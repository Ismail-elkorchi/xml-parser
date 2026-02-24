import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

import { parseXml } from "../../dist/mod.js";

const fixturePath = new URL("../../test/fixtures/conformance/cases.json", import.meta.url);
const reportPath = new URL("../../reports/oracle-xmllint.json", import.meta.url);

function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

function runXmllintVersion() {
  return spawnSync("xmllint", ["--version"], {
    encoding: "utf8"
  });
}

function runXmllint(xml) {
  return spawnSync("xmllint", ["--noout", "-"], {
    input: xml,
    encoding: "utf8"
  });
}

const versionResult = runXmllintVersion();
if (versionResult.error) {
  const report = {
    suite: "oracle-xmllint",
    timestamp: new Date().toISOString(),
    ok: true,
    available: false,
    reason: versionResult.error.message,
    compared: 0,
    mismatches: []
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log("xmllint unavailable; oracle comparison skipped");
  process.exit(0);
}

const fixtures = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const cases = fixtures.cases ?? [];

const mismatches = [];
for (const entry of cases) {
  const parser = parseXml(entry.xml);
  const parserWellFormed = parser.errors.length === 0;

  const oracle = runXmllint(entry.xml);
  const xmllintWellFormed = oracle.status === 0;

  if (parserWellFormed !== xmllintWellFormed) {
    mismatches.push({
      id: entry.id,
      parserWellFormed,
      xmllintWellFormed,
      inputHash: sha256(entry.xml)
    });
  }
}

const report = {
  suite: "oracle-xmllint",
  timestamp: new Date().toISOString(),
  ok: mismatches.length === 0,
  available: true,
  version: `${versionResult.stdout}${versionResult.stderr}`.trim(),
  compared: cases.length,
  mismatches
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (mismatches.length > 0) {
  console.error("xmllint oracle mismatches", JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(`xmllint oracle comparison passed across ${cases.length} cases`);
