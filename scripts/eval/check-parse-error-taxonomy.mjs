import fs from "node:fs/promises";

import { getParseErrorSpecRef, parseXml } from "../../dist/mod.js";

const reportPath = new URL("../../reports/parse-error-taxonomy.json", import.meta.url);
const malformed = "<root><a></root>";
const a = parseXml(malformed);
const b = parseXml(malformed);

const idsA = a.errors.map((entry) => entry.parseErrorId);
const idsB = b.errors.map((entry) => entry.parseErrorId);
const deterministicIds = JSON.stringify(idsA) === JSON.stringify(idsB);
const hasErrors = idsA.length > 0;
const specRef = getParseErrorSpecRef(idsA[0] ?? "");
const specRefOk = specRef === "https://www.w3.org/TR/xml/#sec-well-formed";

let docsContainIds = true;
let missingIds = [];
try {
  const parseErrorDoc = await fs.readFile(new URL("../../docs/parse-errors.md", import.meta.url), "utf8");
  missingIds = [...new Set(idsA)].filter((id) => !parseErrorDoc.includes(`\`${id}\``));
  docsContainIds = missingIds.length === 0;
} catch {
  docsContainIds = false;
  missingIds = [...new Set(idsA)];
}

const ok = deterministicIds && hasErrors && specRefOk && docsContainIds;
const report = {
  suite: "parse-error-taxonomy",
  timestamp: new Date().toISOString(),
  ok,
  deterministicIds,
  hasErrors,
  specRef,
  specRefOk,
  ids: idsA,
  docsContainIds,
  missingIds
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Parse error taxonomy check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
