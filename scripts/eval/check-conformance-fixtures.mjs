import fs from "node:fs/promises";

import { parseXml, parseXmlBytes, parseXmlStream, tokenizeXml, XmlBudgetExceededError } from "../../dist/mod.js";

const fixturePath = new URL("../../test/fixtures/conformance/cases.json", import.meta.url);
const reportPath = new URL("../../reports/conformance-fixtures.json", import.meta.url);

const fixtureDoc = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const cases = fixtureDoc.cases ?? [];

function sortIds(ids) {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

async function runCase(entry) {
  const xml = entry.xml;
  const options = entry.options ?? {};

  const expectedErrors = sortIds(entry.expectedErrorIds ?? []);

  const bytes = new TextEncoder().encode(xml);
  const stream = new ReadableStream({
    start(controller) {
      const split = Math.max(1, Math.floor(bytes.length / 2));
      controller.enqueue(bytes.subarray(0, split));
      controller.enqueue(bytes.subarray(split));
      controller.close();
    }
  });

  try {
    const fromString = parseXml(xml, options);
    const fromBytes = parseXmlBytes(bytes, options);
    const fromStream = await parseXmlStream(stream, options);

    const ids = sortIds(fromString.errors.map((item) => item.parseErrorId));
    const root = fromString.root?.qName ?? null;

    const deterministic =
      fromString.determinismHash === fromBytes.determinismHash &&
      fromString.determinismHash === fromStream.determinismHash;

    const tokenDeterministic = JSON.stringify(tokenizeXml(xml, options)) === JSON.stringify(tokenizeXml(xml, options));

    const namespaceOk =
      entry.expectedRootNamespace === undefined ||
      (fromString.root?.namespaceURI ?? null) === entry.expectedRootNamespace;

    const requireParity = ids.length === 0;

    const ok =
      JSON.stringify(ids) === JSON.stringify(expectedErrors) &&
      root === (entry.expectedRoot ?? null) &&
      namespaceOk &&
      (!requireParity || deterministic) &&
      tokenDeterministic;

    return {
      id: entry.id,
      ok,
      expected: {
        root: entry.expectedRoot ?? null,
        errors: expectedErrors,
        rootNamespace: entry.expectedRootNamespace ?? null
      },
      observed: {
        root,
        errors: ids,
        rootNamespace: fromString.root?.namespaceURI ?? null,
        requireParity,
        deterministic,
        tokenDeterministic
      }
    };
  } catch (error) {
    const isBudget = error instanceof XmlBudgetExceededError;
    const ids = isBudget ? [error.parseErrorId] : ["unexpected-throw"];

    const ok =
      JSON.stringify(sortIds(ids)) === JSON.stringify(expectedErrors) &&
      (entry.expectedRoot ?? null) === null;

    return {
      id: entry.id,
      ok,
      expected: {
        root: entry.expectedRoot ?? null,
        errors: expectedErrors,
        rootNamespace: entry.expectedRootNamespace ?? null
      },
      observed: {
        root: null,
        errors: ids,
        rootNamespace: null,
        deterministic: true,
        tokenDeterministic: true
      }
    };
  }
}

const results = [];
for (const entry of cases) {
  results.push(await runCase(entry));
}

const failures = results.filter((entry) => !entry.ok);
const report = {
  suite: "conformance-fixtures",
  timestamp: new Date().toISOString(),
  ok: failures.length === 0,
  caseCount: cases.length,
  passCount: results.length - failures.length,
  failCount: failures.length,
  failures,
  cases: results
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!report.ok) {
  console.error("Conformance fixtures check failed", JSON.stringify(failures, null, 2));
  process.exit(1);
}
