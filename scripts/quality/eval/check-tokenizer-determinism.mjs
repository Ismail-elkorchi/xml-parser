import fs from "node:fs/promises";

import { parseXml, tokenizeXml } from "../../../dist/mod.js";

const reportPath = new URL("../../../reports/tokenizer-determinism.json", import.meta.url);
const input = "<r xmlns:n=\"urn:n\"><n:a x=\"1\"/>x&amp;y</r>";

const tokenRuns = [tokenizeXml(input), tokenizeXml(input), tokenizeXml(input)];
const tokenBodies = tokenRuns.map((entry) => JSON.stringify(entry));
const deterministic = tokenBodies[0] === tokenBodies[1] && tokenBodies[1] === tokenBodies[2];
const hash = parseXml(input).determinismHash;

const ok = deterministic && tokenRuns[0].length > 0;
const report = {
  suite: "tokenizer-determinism",
  timestamp: new Date().toISOString(),
  ok,
  deterministic,
  tokenCount: tokenRuns[0].length,
  hash
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Tokenizer determinism check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
