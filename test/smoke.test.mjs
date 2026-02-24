import assert from "node:assert/strict";
import test from "node:test";

import {
  getParseErrorSpecRef,
  parseXml,
  parseXmlBytes,
  parseXmlStream,
  serializeXml,
  tokenizeXml,
  XmlBudgetExceededError
} from "../dist/mod.js";

test("parseXml is deterministic", () => {
  const input = "<root a=\"1\"><child>ok</child></root>";
  const a = parseXml(input);
  const b = parseXml(input);
  assert.deepEqual(b, a);
  assert.equal(a.errors.length, 0);
  assert.equal(a.root?.qName, "root");
  assert.equal(a.root?.children[0]?.kind, "element");
});

test("parseXmlBytes returns same source as string parse", () => {
  const input = "<root>ok</root>";
  const bytes = new TextEncoder().encode(input);
  const fromString = parseXml(input);
  const fromBytes = parseXmlBytes(bytes);
  assert.equal(fromBytes.source, fromString.source);
});

test("parseXmlStream returns parsed source", async () => {
  const input = "<root><n/></root>";
  const bytes = new TextEncoder().encode(input);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 5));
      controller.enqueue(bytes.subarray(5));
      controller.close();
    }
  });

  const parsed = await parseXmlStream(stream);
  assert.equal(parsed.source, input);
  assert.equal(parsed.root?.qName, "root");
});

test("namespace mapping is preserved on elements and attributes", () => {
  const input = "<n:root xmlns:n=\"urn:n\" n:id=\"1\"><n:child/></n:root>";
  const parsed = parseXml(input);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.root?.namespaceURI, "urn:n");
  assert.equal(parsed.root?.attributes[1]?.namespaceURI, "urn:n");
});

test("serializer roundtrip is deterministic", () => {
  const input = "<root><child k=\"v\">ok</child></root>";
  const parsed = parseXml(input);
  const serializedA = serializeXml(parsed);
  const serializedB = serializeXml(parsed);
  assert.equal(serializedA, serializedB);
  const reparsed = parseXml(serializedA);
  assert.equal(reparsed.errors.length, 0);
  assert.equal(reparsed.root?.qName, "root");
});

test("tokenizer emits deterministic tokens", () => {
  const input = "<root><a x=\"1\"/>text</root>";
  const a = tokenizeXml(input);
  const b = tokenizeXml(input);
  assert.deepEqual(a, b);
  assert.equal(a[0]?.kind, "start-tag");
  assert.equal(a[1]?.kind, "start-tag");
  assert.equal(a[2]?.kind, "text");
});

test("parseErrorId and spec reference are stable", () => {
  const malformed = "<root><a></root>";
  const a = parseXml(malformed);
  const b = parseXml(malformed);
  assert.deepEqual(
    a.errors.map((entry) => entry.parseErrorId),
    b.errors.map((entry) => entry.parseErrorId)
  );
  assert.equal(getParseErrorSpecRef(a.errors[0]?.parseErrorId ?? ""), "https://www.w3.org/TR/xml/#sec-well-formed");
});

test("DTD is disabled by default", () => {
  const parsed = parseXml("<!DOCTYPE root><root/>");
  assert.equal(parsed.errors.some((entry) => entry.parseErrorId === "disallowed-dtd"), true);
});

test("stream and string parsing produce equal structural hashes", async () => {
  const input = "<root><item a=\"1\">x</item><item a=\"2\">y</item></root>";
  const bytes = new TextEncoder().encode(input);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 8));
      controller.enqueue(bytes.subarray(8, 17));
      controller.enqueue(bytes.subarray(17));
      controller.close();
    }
  });
  const a = parseXml(input);
  const b = await parseXmlStream(stream);
  assert.equal(a.determinismHash, b.determinismHash);
});

test("budget errors are structured and deterministic", () => {
  assert.throws(
    () => parseXml("<root><a/></root>", { budgets: { maxNodes: 1 } }),
    (error) => {
      assert.equal(error instanceof XmlBudgetExceededError, true);
      assert.equal(error.details.budget, "maxNodes");
      assert.equal(error.parseErrorId, "budget-exceeded");
      return true;
    }
  );
});
