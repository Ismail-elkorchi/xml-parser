import { createXmlReplayContract } from "../../dist/mod.js";

function detectRuntime() {
  if (typeof Deno !== "undefined") {
    return "deno";
  }
  if (typeof Bun !== "undefined") {
    return "bun";
  }
  return "node";
}

function parseArg(prefix, fallback) {
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  if (!arg) {
    return fallback;
  }
  return arg.slice(prefix.length);
}

const fixtures = {
  valid: "<root xmlns:n=\"urn:n\"><n:item id=\"1\">alpha</n:item><item>beta</item></root>",
  malformed: "<root><item id=\"1\"></root>"
};

const fixtureName = parseArg("--fixture=", "valid");
const fixture = fixtures[fixtureName];

if (!fixture) {
  throw new Error(`Unknown fixture: ${fixtureName}`);
}

const options = {
  maxEvents: 128
};

const contractA = createXmlReplayContract(fixture, options);
const contractB = createXmlReplayContract(fixture, options);

if (contractA.replayHash !== contractB.replayHash) {
  throw new Error("Replay contract is non-deterministic within runtime");
}

const eventKinds = [...new Set(contractA.events.map((entry) => entry.kind))];

console.log(
  JSON.stringify({
    suite: "runtime-replay",
    runtime: detectRuntime(),
    fixture: fixtureName,
    ok: true,
    replayHash: contractA.replayHash,
    determinismHash: contractA.determinismHash,
    eventKinds,
    eventCount: contractA.events.length,
    truncated: contractA.truncated
  })
);
