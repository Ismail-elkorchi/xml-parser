import assert from "node:assert/strict";
import test from "node:test";

import { createXmlReplayContract, verifyXmlReplayContract } from "../dist/mod.js";

const SAMPLE = "<root xmlns:n=\"urn:n\"><n:item id=\"1\">alpha</n:item><item>beta</item></root>";
const MALFORMED = "<root><item id=\"1\"></root>";

test("replay contract is deterministic for stable input", () => {
  const contractA = createXmlReplayContract(SAMPLE, { maxEvents: 64 });
  const contractB = createXmlReplayContract(SAMPLE, { maxEvents: 64 });

  assert.deepEqual(contractA, contractB);
  assert.equal(contractA.contract, "xml-replay-v1");
  assert.equal(contractA.events.some((entry) => entry.kind === "token"), true);
  assert.equal(contractA.events.some((entry) => entry.kind === "tree-node"), true);
  assert.equal(contractA.events.some((entry) => entry.kind === "summary"), true);

  const verification = verifyXmlReplayContract(SAMPLE, contractA, { maxEvents: 64 });
  assert.equal(verification.ok, true);
  assert.equal(verification.mismatch, null);
});

test("replay contract carries parse-error diagnostics for malformed XML", () => {
  const contract = createXmlReplayContract(MALFORMED, { maxEvents: 64 });
  assert.equal(contract.events.some((entry) => entry.kind === "parse-error"), true);

  const tampered = {
    ...contract,
    replayHash: "0".repeat(contract.replayHash.length)
  };
  const verification = verifyXmlReplayContract(MALFORMED, tampered, { maxEvents: 64 });
  assert.equal(verification.ok, false);
  assert.equal(verification.mismatch, "replay-hash-mismatch");
});

test("replay contract maxEvents enforces deterministic truncation", () => {
  const contract = createXmlReplayContract(SAMPLE, { maxEvents: 1 });
  assert.equal(contract.events.length, 1);
  assert.equal(contract.events[0]?.kind, "summary");
  assert.equal(contract.events[0]?.truncated, true);
  assert.equal(contract.truncated, true);
});
