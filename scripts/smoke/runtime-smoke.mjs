import { parseXml, parseXmlBytes, parseXmlStream, serializeXml, tokenizeXml } from "../../dist/mod.js";

const INPUT = "<root xmlns:n=\"urn:n\"><n:item id=\"1\">alpha &amp; beta</n:item><n:item id=\"2\"><![CDATA[x<y]]></n:item></root>";
const EXPECTED_HASH = "33a592c987f47ad7";

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
assert(fromString.determinismHash === fromBytes.determinismHash, "string/bytes hashes must match");
assert(fromString.determinismHash === fromStream.determinismHash, "string/stream hashes must match");
assert(fromString.determinismHash === EXPECTED_HASH, "hash must match cross-runtime expected value");
assert(tokenizeXml(INPUT).length > 0, "token stream must be non-empty");

const serialized = serializeXml(fromString);
const reparsed = parseXml(serialized);
assert(reparsed.errors.length === 0, "serialized roundtrip must stay well-formed");

const report = {
  suite: "runtime-smoke",
  runtime,
  ok: true,
  hash: fromString.determinismHash,
  root: fromString.root?.qName ?? null,
  tokenCount: tokenizeXml(INPUT).length,
  serializedBytes: new TextEncoder().encode(serialized).length
};

console.log(JSON.stringify(report));
