import fs from "node:fs/promises";

import {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  listTextNodes,
  parseXml
} from "../../dist/mod.js";

const reportPath = new URL("../../reports/query-layer.json", import.meta.url);
const sample = `<root xmlns:n="urn:n"><item id="a"/><group><n:item id="b"/><item flag="x">txt</item></group></root>`;

function snapshotQueries() {
  const doc = parseXml(sample);
  return {
    rootQName: doc.root?.qName ?? null,
    dfsNodeIds: [...iterateElements(doc)].map((entry) => entry.nodeId),
    itemNodeIds: listElementsByQName(doc, "item").map((entry) => entry.nodeId),
    flagNodeIds: listElementsByAttribute(doc, "flag", "x").map((entry) => entry.nodeId),
    namespacedItemNodeIds: listElementsByNamespace(doc, "urn:n", "item").map((entry) => entry.nodeId),
    firstGroupNodeId: findFirstElementByQName(doc, "group")?.nodeId ?? null,
    textValues: listTextNodes(doc).map((entry) => entry.value),
    parseErrors: doc.errors.map((entry) => entry.parseErrorId)
  };
}

const runA = snapshotQueries();
const runB = snapshotQueries();

const checks = {
  noParseErrors: runA.parseErrors.length === 0,
  deterministic: JSON.stringify(runA) === JSON.stringify(runB),
  expectedDfsOrder: JSON.stringify(runA.dfsNodeIds) === JSON.stringify([1, 2, 3, 4, 5]),
  expectedQNameMatches: JSON.stringify(runA.itemNodeIds) === JSON.stringify([2, 5]),
  expectedAttributeMatches: JSON.stringify(runA.flagNodeIds) === JSON.stringify([5]),
  expectedNamespaceMatches: JSON.stringify(runA.namespacedItemNodeIds) === JSON.stringify([4]),
  expectedFirstMatch: runA.firstGroupNodeId === 3,
  expectedTextValues: JSON.stringify(runA.textValues) === JSON.stringify(["txt"])
};

const ok = Object.values(checks).every((value) => value === true);
const report = {
  suite: "query-layer",
  timestamp: new Date().toISOString(),
  ok,
  checks,
  observed: runA
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Query layer check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
