import assert from "node:assert/strict";
import test from "node:test";

import {
  listElementsByAttribute,
  listElementsByQName,
  parseXml,
  parseXmlBytes,
  parseXmlStream,
  tokenizeXml,
  validateXmlProfile,
  XmlConfigurationError
} from "../dist/mod.js";

test("public entrypoints reject invalid JavaScript arguments consistently", async () => {
  assert.throws(() => parseXml(null), XmlConfigurationError);
  assert.throws(() => parseXmlBytes("<r/>"), XmlConfigurationError);
  assert.throws(() => tokenizeXml(1), XmlConfigurationError);
  await assert.rejects(parseXmlStream({}), XmlConfigurationError);
  assert.throws(() => listElementsByQName(parseXml("<r/>"), null), XmlConfigurationError);
  assert.throws(
    () => listElementsByAttribute({ kind: "element", qName: "r", localName: "r", prefix: null, namespaceURI: null, attributes: [null], children: [] }, "a"),
    XmlConfigurationError
  );
  assert.throws(() => validateXmlProfile(parseXml("<r/>"), null), XmlConfigurationError);
  assert.throws(
    () => validateXmlProfile(parseXml("<r/>"), { maxOccurrencesByElementQName: { r: -1 } }),
    XmlConfigurationError
  );
  assert.throws(
    () => validateXmlProfile(parseXml("<r/>"), { requiredElementQNames: ["bad name"] }),
    XmlConfigurationError
  );
});
