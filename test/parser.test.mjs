import assert from "node:assert/strict";
import test from "node:test";

import {
  getParseErrorSpecRef,
  parseXml,
  parseXmlBytes,
  parseXmlStream,
  XmlBudgetExceededError,
  XmlConfigurationError,
  XmlDecodingError
} from "../dist/mod.js";

function errorIds(xml) {
  return parseXml(xml).errors.map((error) => error.parseErrorId);
}

function byteStream(chunks, onCancel) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      if (onCancel === undefined) controller.close();
    },
    cancel(reason) { onCancel?.(reason); }
  });
}

test("parsing normalizes XML line endings and preserves namespace semantics", () => {
  const document = parseXml("<élément xmlns:n=\"urn:n\" 名=\"值\"><n:����/>\r\nx\ry</élément>");
  assert.deepEqual(document.errors, []);
  assert.equal(document.source, "<élément xmlns:n=\"urn:n\" 名=\"值\"><n:����/>\nx\ny</élément>");
  assert.equal(document.root?.qName, "élément");
  assert.equal(document.root?.children[0]?.namespaceURI, "urn:n");
  assert.equal(document.root?.children[1]?.value, "\nx\ny");
});

test("a leading BOM is handled consistently by string and byte APIs", () => {
  const source = "\uFEFF<root/>";
  const fromString = parseXml(source);
  const fromBytes = parseXmlBytes(new TextEncoder().encode(source));
  assert.deepEqual(fromString.errors, []);
  assert.deepEqual(fromBytes.errors, []);
  assert.equal(fromString.source, "<root/>");
  assert.equal(fromBytes.source, "<root/>");
  assert.deepEqual(fromBytes.root, fromString.root);
});

test("malformed XML has typed deterministic diagnostics", () => {
  const cases = [
    ["<r>&bad</r>", "malformed-entity-reference"],
    ["<r>&#0;</r>", "invalid-character-reference"],
    ["<r a=\"x<y\"/>", "less-than-in-attribute-value"],
    ["<r>]]></r>", "cdata-close-in-character-data"],
    ["<![CDATA[]]><r/>", "cdata-outside-root"],
    ["<a:b:c xmlns:a=\"urn:a\"/>", "malformed-qualified-name"],
    ["<r><!--a--b--></r>", "malformed-comment"],
    ["<r a=\"1\"b=\"2\"/>", "malformed-attribute"],
    ["<r>\u0000</r>", "invalid-xml-character"],
    ["<?XML version=\"1.0\"?><r/>", "reserved-processing-instruction-target"],
    ["<?a:b?><r/>", "malformed-qualified-name"],
    ["<!DOCTYPEroot><r/>", "malformed-tag"]
  ];
  for (const [xml, expected] of cases) {
    assert.ok(errorIds(xml).includes(expected), `${expected} not reported for ${JSON.stringify(xml)}`);
  }
});

test("namespace constraints and expanded attribute uniqueness are enforced", () => {
  assert.ok(errorIds("<xmlns:r/>").includes("namespace-prefix-reserved"));
  assert.ok(errorIds("<r xmlns:p=\"\"/>").includes("namespace-prefix-undeclared"));
  assert.ok(errorIds('<r xmlns:a="urn:x" xmlns:b="urn:x" a:id="1" b:id="2"/>')
    .includes("duplicate-expanded-attribute"));
});

test("all structural limits apply before retaining over-budget structures", () => {
  assert.throws(() => parseXml("<root/>", { budgets: { maxDepth: 0 } }), (error) =>
    error instanceof XmlBudgetExceededError && error.budget === "maxDepth");
  assert.throws(() => parseXml("<r a=\"1\" b=\"2\"/>", { budgets: { maxAttributesPerElement: 1 } }), (error) =>
    error instanceof XmlBudgetExceededError && error.budget === "maxAttributesPerElement");
  assert.throws(() => parseXml("<r><a/></r>", { budgets: { maxNodes: 1 } }), (error) =>
    error instanceof XmlBudgetExceededError && error.budget === "maxNodes");
});

test("invalid budgets use one public configuration error", () => {
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5, "1"]) {
    assert.throws(() => parseXml("<r/>", { budgets: { maxNodes: value } }), (error) =>
      error instanceof XmlConfigurationError && error.code === "INVALID_BUDGET");
  }
  assert.throws(() => parseXml("<r/>", { budgets: { unknown: 1 } }), XmlConfigurationError);
});

test("byte APIs reject malformed UTF-8 and non-UTF-8 declarations", () => {
  assert.throws(() => parseXmlBytes(new Uint8Array([0xff])), (error) =>
    error instanceof XmlDecodingError && error.code === "INVALID_UTF8");
  const unsupported = new TextEncoder().encode('<?xml version="1.0" encoding="iso-8859-1"?><r/>');
  assert.throws(() => parseXmlBytes(unsupported), (error) =>
    error instanceof XmlDecodingError && error.code === "UNSUPPORTED_XML_ENCODING" && error.encoding === "iso-8859-1");
});

test("stream parsing is chunk invariant and always releases its reader", async () => {
  const bytes = new TextEncoder().encode("<root><item/></root>");
  const stream = byteStream([bytes.subarray(0, 2), bytes.subarray(2, 9), bytes.subarray(9)]);
  const document = await parseXmlStream(stream);
  assert.deepEqual(document.root, parseXml("<root><item/></root>").root);
  assert.equal(document.source, null);
  assert.equal(stream.locked, false);

  let cancellationReason;
  const failing = byteStream([new Uint8Array([0xff])], (reason) => { cancellationReason = reason; });
  await assert.rejects(parseXmlStream(failing), XmlDecodingError);
  assert.ok(cancellationReason instanceof XmlDecodingError);
  assert.equal(failing.locked, false);

  cancellationReason = undefined;
  const oversized = byteStream([bytes], (reason) => { cancellationReason = reason; });
  await assert.rejects(
    parseXmlStream(oversized, { budgets: { maxStreamBytes: 4 } }),
    (error) => error instanceof XmlBudgetExceededError && error.budget === "maxStreamBytes"
  );
  assert.ok(cancellationReason instanceof XmlBudgetExceededError);
  assert.equal(oversized.locked, false);
});

test("diagnostic specification references are specific and policy diagnostics return null", () => {
  assert.match(getParseErrorSpecRef("invalid-xml-character"), /#charsets$/);
  assert.match(getParseErrorSpecRef("namespace-prefix-undefined"), /xml-names\/$/);
  assert.equal(getParseErrorSpecRef("disallowed-dtd"), null);
  assert.throws(() => getParseErrorSpecRef("not-a-diagnostic"), XmlConfigurationError);
});
