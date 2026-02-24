import fs from "node:fs/promises";

import { parseXml, serializeXml } from "../../dist/mod.js";

const reportPath = new URL("../../reports/integration-reliability.json", import.meta.url);
const fixturePath = new URL("../../test/fixtures/integration/reliability.json", import.meta.url);

const fixtureDoc = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const fixtures = fixtureDoc.fixtures ?? [];

const checks = fixtures.map((fixture) => {
  const parsed = parseXml(fixture.xml);
  const serialized = serializeXml(parsed);
  const reparsed = parseXml(serialized);
  const expectedReparseErrorCount = fixture.expectedReparseErrorCount ?? fixture.expectedErrorCount;

  const ok =
    parsed.errors.length === fixture.expectedErrorCount &&
    (parsed.root?.qName ?? null) === fixture.expectedRoot &&
    reparsed.errors.length === expectedReparseErrorCount;

  return {
    id: fixture.id,
    ok,
    expectedRoot: fixture.expectedRoot,
    observedRoot: parsed.root?.qName ?? null,
    expectedErrorCount: fixture.expectedErrorCount,
    observedErrorCount: parsed.errors.length,
    expectedReparseErrorCount,
    observedReparseErrorCount: reparsed.errors.length
  };
});

const ok = checks.every((entry) => entry.ok);
const report = {
  suite: "integration-reliability",
  timestamp: new Date().toISOString(),
  ok,
  fixtures: checks
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Integration reliability check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
