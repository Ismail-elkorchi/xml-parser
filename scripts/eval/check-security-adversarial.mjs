import fs from "node:fs/promises";

import { parseXml, XmlBudgetExceededError } from "../../dist/mod.js";

const reportPath = new URL("../../reports/security-adversarial.json", import.meta.url);

const checks = [];

const doctype = parseXml("<!DOCTYPE root><root/>");
checks.push({
  id: "dtd-default-deny",
  ok: doctype.errors.some((entry) => entry.parseErrorId === "disallowed-dtd")
});

const externalEntity = parseXml("<!DOCTYPE root SYSTEM \"https://example.com/x.dtd\"><root/>", {
  allowDtd: true,
  allowExternalEntities: false
});
checks.push({
  id: "external-entity-default-deny",
  ok: externalEntity.errors.some((entry) => entry.parseErrorId === "disallowed-external-entity")
});

let depthBudgetOk = false;
try {
  parseXml("<a><b><c/></b></a>", { budgets: { maxDepth: 1 } });
} catch (error) {
  depthBudgetOk = error instanceof XmlBudgetExceededError && error.details.budget === "maxDepth";
}
checks.push({
  id: "depth-budget",
  ok: depthBudgetOk
});

let textBudgetOk = false;
try {
  parseXml("<root>abcdefghijklmnopqrstuvwxyz</root>", { budgets: { maxTextBytes: 4 } });
} catch (error) {
  textBudgetOk = error instanceof XmlBudgetExceededError && error.details.budget === "maxTextBytes";
}
checks.push({
  id: "text-budget",
  ok: textBudgetOk
});

const ok = checks.every((entry) => entry.ok);
const report = {
  suite: "security-adversarial",
  timestamp: new Date().toISOString(),
  ok,
  checks
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Security adversarial check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
