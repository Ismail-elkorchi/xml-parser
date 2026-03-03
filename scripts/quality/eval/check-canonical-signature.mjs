import fs from "node:fs/promises";

import {
  canonicalizeXml,
  computeCanonicalSha256,
  parseXml,
  signCanonicalXml,
  verifyCanonicalSha256,
  verifyCanonicalXmlSignature
} from "../../../dist/mod.js";

const reportPath = new URL("../../../reports/canonical-signature.json", import.meta.url);
const sample = "<root b=\"2\" a=\"1\"><child z=\"9\" y=\"8\">txt &amp; more</child></root>";

const docA = parseXml(sample);
const docB = parseXml(sample);
const canonicalA = canonicalizeXml(docA);
const canonicalB = canonicalizeXml(docB);

const digest = await computeCanonicalSha256(docA);
const digestOk = await verifyCanonicalSha256(docA, digest);

const subtle = globalThis.crypto?.subtle;
if (!subtle) {
  throw new Error("WebCrypto SubtleCrypto is required for canonical signature checks");
}

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

const signature = await signCanonicalXml(docA, keyPair.privateKey);
const signatureOk = await verifyCanonicalXmlSignature(docA, signature, keyPair.publicKey);
const tampered = parseXml("<root a=\"1\" b=\"2\"><child y=\"8\" z=\"9\">tampered</child></root>");
const tamperedSignatureOk = await verifyCanonicalXmlSignature(tampered, signature, keyPair.publicKey);

const checks = {
  canonicalDeterministic: canonicalA === canonicalB,
  canonicalExpected:
    canonicalA === "<root a=\"1\" b=\"2\"><child y=\"8\" z=\"9\">txt &amp; more</child></root>",
  digestVerify: digestOk,
  signatureVerify: signatureOk,
  tamperRejected: tamperedSignatureOk === false
};

const ok = Object.values(checks).every((value) => value === true);

const report = {
  suite: "canonical-signature",
  timestamp: new Date().toISOString(),
  ok,
  checks,
  canonicalLength: canonicalA.length,
  digest,
  signatureBytes: signature.byteLength
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Canonical/signature check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
