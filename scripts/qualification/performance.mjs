import fs from "node:fs/promises";

import { parseXml } from "../../dist/mod.js";

const reportPath = new URL("../../reports/performance-complexity.json", import.meta.url);
const encoder = new TextEncoder();

function buildPayload(repeatCount) {
  let body = "";
  for (let i = 0; i < repeatCount; i += 1) {
    body += `<item id="${i}"><name>n${i}</name><value>${i}</value><flag a="x" b="y"/></item>`;
  }
  return `<root>${body}</root>`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function runScenario(name, xml, iterations) {
  const bytes = encoder.encode(xml).length;

  for (let i = 0; i < 5; i += 1) {
    parseXml(xml);
  }

  const durationsNs = [];
  let maxErrors = 0;

  for (let i = 0; i < iterations; i += 1) {
    const start = process.hrtime.bigint();
    const parsed = parseXml(xml);
    const end = process.hrtime.bigint();
    durationsNs.push(Number(end - start));
    maxErrors = Math.max(maxErrors, parsed.errors.length);
  }

  const medianNs = median(durationsNs);
  return {
    name,
    bytes,
    iterations,
    maxErrors,
    medianNs,
    medianMs: Number((medianNs / 1_000_000).toFixed(6)),
    nsPerByte: Number((medianNs / bytes).toFixed(3))
  };
}

const scenarios = [
  { name: "small", xml: buildPayload(20), iterations: 30 },
  { name: "medium", xml: buildPayload(120), iterations: 20 },
  { name: "large", xml: buildPayload(360), iterations: 12 }
];

const results = scenarios.map((scenario) => runScenario(scenario.name, scenario.xml, scenario.iterations));

const growth = results.slice(1).map((current, index) => {
  const previous = results[index];
  if (!previous) throw new Error("Missing preceding performance scenario");
  const inputRatio = current.bytes / previous.bytes;
  const timeRatio = current.medianNs / previous.medianNs;
  return {
    from: previous.name,
    to: current.name,
    inputRatio: Number(inputRatio.toFixed(6)),
    timeRatio: Number(timeRatio.toFixed(6)),
    normalizedGrowth: Number((timeRatio / inputRatio).toFixed(6))
  };
});
const parseErrorFree = results.every((item) => item.maxErrors === 0);

const limits = {
  maxNormalizedGrowth: 1.5
};

const checks = {
  parseErrorFree,
  growth
};

const ok =
  parseErrorFree &&
  growth.every((entry) => entry.normalizedGrowth <= limits.maxNormalizedGrowth);

const report = {
  suite: "performance-complexity",
  timestamp: new Date().toISOString(),
  ok,
  limits,
  checks,
  scenarios: results
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Performance complexity check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
