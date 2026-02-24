import assert from "node:assert/strict";
import test from "node:test";

import {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  listTextNodes,
  parseXml
} from "../dist/mod.js";

const SAMPLE = `<root xmlns:n="urn:n"><item id="a"/><group><n:item id="b"/><item flag="x">txt</item></group></root>`;

test("query layer returns deterministic DFS order", () => {
  const docA = parseXml(SAMPLE);
  const docB = parseXml(SAMPLE);

  const idsA = [...iterateElements(docA)].map((node) => node.nodeId);
  const idsB = [...iterateElements(docB)].map((node) => node.nodeId);

  assert.deepEqual(idsA, [1, 2, 3, 4, 5]);
  assert.deepEqual(idsB, idsA);
});

test("query layer finds elements by qName and attribute", () => {
  const document = parseXml(SAMPLE);

  const items = listElementsByQName(document, "item");
  assert.deepEqual(items.map((entry) => entry.nodeId), [2, 5]);

  const flagged = listElementsByAttribute(document, "flag", "x");
  assert.deepEqual(flagged.map((entry) => entry.nodeId), [5]);

  const first = findFirstElementByQName(document, "group");
  assert.equal(first?.nodeId, 3);
});

test("query layer filters by namespace and lists text nodes deterministically", () => {
  const document = parseXml(SAMPLE);

  const namespaced = listElementsByNamespace(document, "urn:n", "item");
  assert.deepEqual(namespaced.map((entry) => entry.nodeId), [4]);

  const textNodes = listTextNodes(document);
  assert.deepEqual(textNodes.map((entry) => entry.kind), ["text"]);
  assert.deepEqual(textNodes.map((entry) => entry.value), ["txt"]);
});
