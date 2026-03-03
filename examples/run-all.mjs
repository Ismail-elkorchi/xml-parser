import process from "node:process";
import { TextEncoder } from "node:util";

import {
  listElementsByQName,
  parseXml,
  parseXmlBytes,
  serializeXml,
  validateXmlProfile
} from "../dist/mod.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runParseScenario() {
  const document = parseXml("<root><item id=\"1\">ok</item></root>");
  const xml = serializeXml(document);
  assert(xml.includes("<root>"), "serializeXml should include root element");
}

function runBytesScenario() {
  const bytes = new TextEncoder().encode("<feed><entry/></feed>");
  const document = parseXmlBytes(bytes);
  const entries = listElementsByQName(document, "entry");
  assert(entries.length === 1, "parseXmlBytes should parse entry element");
}

function runValidationScenario() {
  const document = parseXml("<invoice><line amount=\"10\"/></invoice>");
  const result = validateXmlProfile(document, {
    expectedRootQName: "invoice",
    requiredElementQNames: ["line"],
    requiredAttributesByElementQName: {
      line: ["amount"]
    }
  });
  assert(result.ok, "validateXmlProfile should pass required element/attribute checks");
}

runParseScenario();
runBytesScenario();
runValidationScenario();

process.stdout.write("examples:run ok\n");
