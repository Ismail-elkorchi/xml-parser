import assert from "node:assert/strict";
import test from "node:test";

import { parseXml, serializeXml, XmlConfigurationError } from "../dist/mod.js";

function element(qName, attributes = [], children = []) {
  const separator = qName.indexOf(":");
  return {
    kind: "element",
    qName,
    localName: separator < 0 ? qName : qName.slice(separator + 1),
    prefix: separator < 0 ? null : qName.slice(0, separator),
    namespaceURI: null,
    attributes: attributes.map((attribute) => ({
      localName: attribute.qName,
      prefix: null,
      namespaceURI: null,
      ...attribute
    })),
    children
  };
}

test("serialization preserves a valid tree across a parse round trip", () => {
  const document = parseXml('<n:root xmlns:n="urn:n" a="&quot;"><n:item>x &amp; y</n:item></n:root>');
  const serialized = serializeXml(document);
  assert.equal(serialized, '<n:root xmlns:n="urn:n" a="&quot;"><n:item>x &amp; y</n:item></n:root>');
  assert.deepEqual(parseXml(serialized).errors, []);
});

test("caller-constructed trees are validated before serialization", () => {
  assert.equal(serializeXml(element("root", [], [{ kind: "text", value: "x<y" }])), "<root>x&lt;y</root>");
  assert.throws(() => serializeXml(element("bad name")), XmlConfigurationError);
  assert.throws(() => serializeXml(element("p:root")), XmlConfigurationError);
  assert.throws(() => serializeXml(element("root", [{ qName: "a", value: "1" }, { qName: "a", value: "2" }])), XmlConfigurationError);
  assert.throws(() => serializeXml(element("root", [], [{ kind: "text", value: "\u0000" }])), XmlConfigurationError);
  assert.throws(
    () => serializeXml({ ...element("root"), localName: "different" }),
    XmlConfigurationError
  );
});

test("serialization preserves normalized character-reference values", () => {
  const document = parseXml('<root a="&#x9;&#xA;&#xD;">x&#xD;y</root>');
  const serialized = serializeXml(document);
  assert.equal(serialized, '<root a="&#x9;&#xA;&#xD;">x&#xD;y</root>');
  const reparsed = parseXml(serialized);
  assert.equal(reparsed.root?.attributes[0]?.value, "\t\n\r");
  assert.equal(reparsed.root?.children[0]?.value, "x\ry");
});

test("serialization rejects recovered documents and cyclic or shared node graphs", () => {
  assert.throws(() => serializeXml(parseXml("<root><x></root>")), XmlConfigurationError);
  const cycle = element("root");
  cycle.children.push(cycle);
  assert.throws(() => serializeXml(cycle), XmlConfigurationError);
  const child = element("child");
  assert.throws(() => serializeXml(element("root", [], [child, child])), XmlConfigurationError);
});
