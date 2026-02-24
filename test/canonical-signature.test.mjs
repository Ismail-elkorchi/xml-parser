import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeXml,
  computeCanonicalSha256,
  parseXml,
  signCanonicalXml,
  verifyCanonicalSha256,
  verifyCanonicalXmlSignature
} from "../dist/mod.js";

const SAMPLE = "<root b=\"2\" a=\"1\"><child z=\"9\" y=\"8\">txt &amp; more</child></root>";

test("canonical XML output is deterministic", () => {
  const docA = parseXml(SAMPLE);
  const docB = parseXml(SAMPLE);
  const canonicalA = canonicalizeXml(docA);
  const canonicalB = canonicalizeXml(docB);

  assert.equal(canonicalA, canonicalB);
  assert.equal(
    canonicalA,
    "<root a=\"1\" b=\"2\"><child y=\"8\" z=\"9\">txt &amp; more</child></root>"
  );
});

test("canonical digest verification is deterministic", async () => {
  const doc = parseXml(SAMPLE);
  const digest = await computeCanonicalSha256(doc);
  const verifyOk = await verifyCanonicalSha256(doc, digest);
  const verifyFail = await verifyCanonicalSha256(doc, "00".repeat(32));

  assert.equal(verifyOk, true);
  assert.equal(verifyFail, false);
});

test("canonical signature verification succeeds then fails on tamper", async () => {
  const subtle = globalThis.crypto.subtle;
  const keyPair = await subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  );

  const sourceDoc = parseXml(SAMPLE);
  const signature = await signCanonicalXml(sourceDoc, keyPair.privateKey);
  const verified = await verifyCanonicalXmlSignature(sourceDoc, signature, keyPair.publicKey);

  const tamperedDoc = parseXml("<root a=\"1\" b=\"2\"><child y=\"8\" z=\"9\">tampered</child></root>");
  const tamperedVerified = await verifyCanonicalXmlSignature(tamperedDoc, signature, keyPair.publicKey);

  assert.equal(verified, true);
  assert.equal(tamperedVerified, false);
});
