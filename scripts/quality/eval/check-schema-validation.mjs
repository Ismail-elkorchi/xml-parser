import fs from "node:fs/promises";

import { parseXml, validateXmlProfile } from "../../../dist/mod.js";

const reportPath = new URL("../../../reports/schema-validation.json", import.meta.url);

const profile = {
  expectedRootQName: "catalog",
  requiredElementQNames: ["book", "title"],
  requiredAttributesByElementQName: {
    book: ["id"]
  },
  maxOccurrencesByElementQName: {
    title: 2
  }
};

const valid = parseXml("<catalog><book id=\"b1\"><title>One</title></book></catalog>");
const invalidA = parseXml("<catalog><book><title>A</title><title>B</title><title>C</title></book></catalog>");
const invalidB = parseXml("<catalog><book><title>A</title><title>B</title><title>C</title></book></catalog>");

const validResult = validateXmlProfile(valid, profile);
const invalidResultA = validateXmlProfile(invalidA, profile);
const invalidResultB = validateXmlProfile(invalidB, profile);

const checks = {
  validPasses: validResult.ok === true,
  invalidFails: invalidResultA.ok === false,
  deterministic: JSON.stringify(invalidResultA) === JSON.stringify(invalidResultB),
  missingAttributeDetected: invalidResultA.issues.some((entry) => entry.code === "missing-attribute"),
  maxOccurrencesDetected: invalidResultA.issues.some((entry) => entry.code === "max-occurrences-exceeded")
};

const ok = Object.values(checks).every((value) => value === true);

const report = {
  suite: "schema-validation",
  timestamp: new Date().toISOString(),
  ok,
  checks,
  profile,
  validResult,
  invalidResult: invalidResultA
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Schema validation check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
