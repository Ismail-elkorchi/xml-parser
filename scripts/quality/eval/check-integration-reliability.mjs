import fs from "node:fs/promises";

import { listElementsByAttribute, listElementsByQName, listTextNodes, parseXml, serializeXml } from "../../../dist/mod.js";

const reportPath = new URL("../../../reports/integration-reliability.json", import.meta.url);
const fixturePath = new URL("../../../test/fixtures/integration/reliability.json", import.meta.url);

const fixtureDoc = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const fixtures = fixtureDoc.fixtures ?? [];

const checks = fixtures.map((fixture) => {
  const parsed = parseXml(fixture.xml);
  const serialized = serializeXml(parsed);
  const reparsed = parseXml(serialized);
  const expectedReparseErrorCount = fixture.expectedReparseErrorCount ?? fixture.expectedErrorCount;
  const expectedQNameCounts = fixture.expectedQNameCounts ?? {};
  const expectedAttributeMatches = fixture.expectedAttributeMatches ?? [];
  const expectedTextNodeCount =
    Number.isInteger(fixture.expectedTextNodeCount) ? fixture.expectedTextNodeCount : null;

  const observedQNameCounts = Object.fromEntries(
    Object.keys(expectedQNameCounts).map((qName) => [qName, listElementsByQName(parsed, qName).length])
  );
  const observedAttributeMatches = expectedAttributeMatches.map((spec) => ({
    name: spec.name,
    value: spec.value,
    count: listElementsByAttribute(parsed, spec.name, spec.value).length
  }));
  const observedTextNodeCount = listTextNodes(parsed).length;

  const qNameChecksOk = Object.entries(expectedQNameCounts).every(
    ([qName, expectedCount]) => observedQNameCounts[qName] === expectedCount
  );
  const attributeChecksOk = expectedAttributeMatches.every((spec, index) => observedAttributeMatches[index]?.count === spec.count);
  const textNodeCheckOk = expectedTextNodeCount === null || observedTextNodeCount === expectedTextNodeCount;

  const ok =
    parsed.errors.length === fixture.expectedErrorCount &&
    (parsed.root?.qName ?? null) === fixture.expectedRoot &&
    reparsed.errors.length === expectedReparseErrorCount &&
    qNameChecksOk &&
    attributeChecksOk &&
    textNodeCheckOk;

  return {
    id: fixture.id,
    ok,
    expectedRoot: fixture.expectedRoot,
    observedRoot: parsed.root?.qName ?? null,
    expectedErrorCount: fixture.expectedErrorCount,
    observedErrorCount: parsed.errors.length,
    expectedReparseErrorCount,
    observedReparseErrorCount: reparsed.errors.length,
    expectedQNameCounts,
    observedQNameCounts,
    expectedAttributeMatches,
    observedAttributeMatches,
    expectedTextNodeCount,
    observedTextNodeCount
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
