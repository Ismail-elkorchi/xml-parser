import { parseXml, parseXmlBytes, parseXmlStream, serializeXml, tokenizeXml } from "../../dist/mod.js";

const INPUT = "<root xmlns:n=\"urn:n\"><n:item id=\"1\">alpha &amp; beta</n:item><n:item id=\"2\"><![CDATA[x<y]]></n:item></root>";

function detectRuntime() {
  if (typeof Deno !== "undefined") {
    return "deno";
  }
  if (typeof Bun !== "undefined") {
    return "bun";
  }
  return "node";
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const runtime = detectRuntime();
const bytes = new TextEncoder().encode(INPUT);

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(bytes.subarray(0, 12));
    controller.enqueue(bytes.subarray(12, 35));
    controller.enqueue(bytes.subarray(35));
    controller.close();
  }
});

const fromString = parseXml(INPUT);
const fromBytes = parseXmlBytes(bytes);
const fromStream = await parseXmlStream(stream);

assert(fromString.errors.length === 0, "string parse should be error-free");
assert(fromBytes.errors.length === 0, "bytes parse should be error-free");
assert(fromStream.errors.length === 0, "stream parse should be error-free");
const tokenization = tokenizeXml(INPUT);
const snapshot = {
  root: fromString.root,
  errors: fromString.errors,
  tokens: tokenization.tokens
};
assert(JSON.stringify(fromString.root) === JSON.stringify(fromBytes.root), "string/bytes trees must match");
assert(JSON.stringify(fromString.root) === JSON.stringify(fromStream.root), "string/stream trees must match");
assert(tokenization.tokens.length > 0, "token stream must be non-empty");

const serialized = serializeXml(fromString);
const reparsed = parseXml(serialized);
assert(reparsed.errors.length === 0, "serialized roundtrip must stay well-formed");

const report = {
  suite: "runtime-smoke",
  runtime,
  ok: true,
  snapshot,
  root: fromString.root?.qName ?? null,
  tokenCount: tokenization.tokens.length,
  serializedBytes: new TextEncoder().encode(serialized).length
};

console.log(JSON.stringify(report));
