import assert from "node:assert/strict";
import test from "node:test";

import { stableHash } from "../dist/internal/hash.js";
import {
  parseXml,
  parseXmlBytes,
  parseXmlStream,
  tokenizeXml,
  XmlBudgetExceededError,
  XmlDecodingError
} from "../dist/mod.js";

function errorIds(xml) {
  return parseXml(xml).errors.map((error) => error.parseErrorId);
}

function byteStream(chunks, onCancel) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      if (onCancel === undefined) {
        controller.close();
      }
    },
    cancel(reason) {
      onCancel?.(reason);
    }
  });
}

test("XML 1.0 Unicode names and end-of-line normalization are supported", () => {
  const document = parseXml("<élément 名=\"值\"><����/>\r\nx\ry</élément>");
  assert.deepEqual(document.errors, []);
  assert.equal(document.root?.qName, "élément");
  assert.equal(document.root?.attributes[0]?.qName, "名");
  assert.equal(document.root?.children[0]?.kind, "element");
  assert.equal(document.root?.children[0]?.qName, "����");
  assert.equal(document.root?.children[1]?.value, "\nx\ny");
  assert.equal(document.source, "<élément 名=\"值\"><����/>\nx\ny</élément>");
});

test("literal attribute whitespace is normalized while character references are retained", () => {
  const document = parseXml("<r a=\"x\t y\nz\">&#xD;</r>");
  assert.deepEqual(document.errors, []);
  assert.equal(document.root?.attributes[0]?.value, "x  y z");
  assert.equal(document.root?.children[0]?.value, "\r");
});

test("malformed XML constructs produce deterministic well-formedness diagnostics", () => {
  const cases = [
    ["<r>&bad</r>", "malformed-entity-reference"],
    ["<r>&#65junk;</r>", "malformed-entity-reference"],
    ["<r>&#0;</r>", "invalid-character-reference"],
    ["<r>&#x110000;</r>", "invalid-character-reference"],
    ["<r a=\"x<y\"/>", "less-than-in-attribute-value"],
    ["<r>]]></r>", "cdata-close-in-character-data"],
    ["< r/>", "malformed-start-tag"],
    ["<a:b:c xmlns:a=\"urn:a\"/>", "malformed-qualified-name"],
    ["<r><!--a--b--></r>", "malformed-comment"],
    ["<r a=\"1\"b=\"2\"/>", "malformed-attribute"],
    ["<r>\u0000</r>", "invalid-xml-character"],
    ["\u00a0<r/>", "text-outside-root"],
    ["<?xml?><r/>", "malformed-xml-declaration"],
    ["<?XML version=\"1.0\"?><r/>", "reserved-processing-instruction-target"]
  ];

  for (const [xml, expected] of cases) {
    assert.ok(errorIds(xml).includes(expected), `${expected} was not reported for ${JSON.stringify(xml)}`);
  }
});

test("valid processing instructions are preserved without parse errors", () => {
  const document = parseXml("<?app run?><r><?xml-stylesheet href=\"x\"?></r>");
  assert.deepEqual(document.errors, []);
  assert.deepEqual(
    document.tokens.filter((token) => token.kind === "processing-instruction").map((token) => token.value),
    ["app run", "xml-stylesheet href=\"x\""]
  );
});

test("namespace reserved names and expanded attribute uniqueness are enforced", () => {
  assert.ok(errorIds("<xmlns:r/>").includes("namespace-prefix-reserved"));
  assert.ok(errorIds("<r xmlns:p=\"\"/>").includes("namespace-prefix-undeclared"));
  assert.ok(
    errorIds('<r xmlns:p="http://www.w3.org/2000/xmlns/"/>').includes("namespace-name-reserved")
  );
  assert.ok(
    errorIds('<r xmlns:a="urn:x" xmlns:b="urn:x" a:id="1" b:id="2"/>').includes(
      "duplicate-expanded-attribute"
    )
  );
});

test("entity diagnostics share the maxErrors budget", () => {
  assert.throws(
    () => parseXml(`<r>${"&missing;".repeat(20)}</r>`, { budgets: { maxErrors: 1 } }),
    (error) => {
      assert.ok(error instanceof XmlBudgetExceededError);
      assert.equal(error.code, "BUDGET_EXCEEDED");
      assert.equal(error.budget, "maxErrors");
      assert.equal(error.limit, 1);
      assert.equal(error.actual, 2);
      return true;
    }
  );
});

test("byte budgets use original transport bytes", () => {
  const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x3c, 0x72, 0x2f, 0x3e]);
  assert.throws(
    () => parseXmlBytes(bytes, { budgets: { maxInputBytes: 6 } }),
    (error) => error instanceof XmlBudgetExceededError && error.actual === 7
  );
});

test("byte and stream APIs reject malformed UTF-8", async () => {
  assert.throws(() => parseXmlBytes(new Uint8Array([0xff])), (error) => {
    assert.ok(error instanceof XmlDecodingError);
    assert.equal(error.code, "INVALID_UTF8");
    assert.equal(error.encoding, "utf-8");
    return true;
  });

  let cancellationReason = null;
  const stream = byteStream([new Uint8Array([0xff])], (reason) => {
    cancellationReason = reason;
  });
  await assert.rejects(parseXmlStream(stream), XmlDecodingError);
  assert.ok(cancellationReason instanceof XmlDecodingError);
  assert.equal(stream.locked, false);
});

test("stream readers are released on success and budget failure", async () => {
  const successful = byteStream([new TextEncoder().encode("<r/>")]);
  await parseXmlStream(successful);
  assert.equal(successful.locked, false);

  let cancellationReason = null;
  const failing = byteStream([new Uint8Array(8)], (reason) => {
    cancellationReason = reason;
  });
  await assert.rejects(
    parseXmlStream(failing, { budgets: { maxInputBytes: 1 } }),
    XmlBudgetExceededError
  );
  assert.ok(cancellationReason instanceof XmlBudgetExceededError);
  assert.equal(failing.locked, false);
});

test("tokenization and hashing expose work to budget checks", () => {
  assert.throws(
    () => tokenizeXml("<r/>", { budgets: { maxInputBytes: 3 } }),
    (error) => error instanceof XmlBudgetExceededError && error.budget === "maxInputBytes"
  );
  assert.throws(
    () => parseXml(`<r>${"x".repeat(10_000)}</r>`, { budgets: { maxTimeMs: 0 } }),
    (error) => error instanceof XmlBudgetExceededError && error.budget === "maxTimeMs"
  );

  let workChecks = 0;
  stableHash({ values: Array.from({ length: 2_000 }, (_, index) => index) }, () => {
    workChecks += 1;
  });
  assert.ok(workChecks > 2_000);
});

test("invalid budget values are rejected", () => {
  for (const maxNodes of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
    assert.throws(() => parseXml("<r/>", { budgets: { maxNodes } }), RangeError);
  }
  assert.throws(() => parseXml("<r/>", { budgets: { unknownLimit: 1 } }), TypeError);
});
