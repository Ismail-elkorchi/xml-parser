import fs from "node:fs/promises";

import { parseXml, parseXmlBytes, parseXmlStream, tokenizeXml } from "../../dist/mod.js";

const fixturePath = new URL("../../test/fixtures/conformance/cases.json", import.meta.url);
const reportPath = new URL("../../reports/conformance-fixtures.json", import.meta.url);

const fixtureDoc = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const cases = fixtureDoc.cases ?? [];

function sortIds(ids) {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

const CATEGORY_MIN_PASS_RATE = {
  core: 1,
  namespace: 1,
  declarations: 1,
  malformed: 1,
  budgets: 1
};

function categoryForCaseId(id) {
  if (id.includes("budget")) {
    return "budgets";
  }
  if (id.includes("namespace") || id.includes("prefix")) {
    return "namespace";
  }
  if (id.includes("doctype") || id.includes("processing-instruction") || id.includes("xml-declaration")) {
    return "declarations";
  }
  if (
    id.includes("malformed") ||
    id.includes("unexpected-end-tag") ||
    id.includes("mismatched-end-tag") ||
    id.includes("multiple-root") ||
    id.includes("text-outside-root") ||
    id.includes("no-root") ||
    id.includes("undefined-entity") ||
    id.includes("duplicate-attribute")
  ) {
    return "malformed";
  }
  return "core";
}

function normalizeThrow(error) {
  if (!error || typeof error !== "object") {
    return {
      parseErrorId: "unexpected-throw",
      details: null
    };
  }

  const parseErrorId =
    "parseErrorId" in error && typeof error.parseErrorId === "string" ? error.parseErrorId : "unexpected-throw";

  const details =
    "details" in error && error.details && typeof error.details === "object"
      ? {
          budget:
            "budget" in error.details && typeof error.details.budget === "string" ? error.details.budget : null,
          limit: "limit" in error.details && typeof error.details.limit === "number" ? error.details.limit : null,
          observed:
            "observed" in error.details && typeof error.details.observed === "number" ? error.details.observed : null
        }
      : null;

  return { parseErrorId, details };
}

async function runPath(label, execute) {
  try {
    const document = await execute();
    return {
      label,
      kind: "ok",
      document
    };
  } catch (error) {
    return {
      label,
      kind: "throw",
      throwInfo: normalizeThrow(error)
    };
  }
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

  const [stringPath, bytesPath, streamPath] = await Promise.all([
    runPath("string", () => parseXml(xml, options)),
    runPath("bytes", () => parseXmlBytes(bytes, options)),
    runPath("stream", () => parseXmlStream(stream, options))
  ]);

  const paths = [stringPath, bytesPath, streamPath];
  const allOk = paths.every((pathResult) => pathResult.kind === "ok");
  const allThrow = paths.every((pathResult) => pathResult.kind === "throw");
  const tokenDeterministic = JSON.stringify(tokenizeXml(xml, options)) === JSON.stringify(tokenizeXml(xml, options));

  if (allOk) {
    const fromString = stringPath.document;
    const fromBytes = bytesPath.document;
    const fromStream = streamPath.document;

    const ids = sortIds(fromString.errors.map((item) => item.parseErrorId));
    const root = fromString.root?.qName ?? null;

    const deterministic =
      fromString.determinismHash === fromBytes.determinismHash &&
      fromString.determinismHash === fromStream.determinismHash;

    const namespaceOk =
      entry.expectedRootNamespace === undefined ||
      (fromString.root?.namespaceURI ?? null) === entry.expectedRootNamespace;

    const ok =
      JSON.stringify(ids) === JSON.stringify(expectedErrors) &&
      root === (entry.expectedRoot ?? null) &&
      namespaceOk &&
      deterministic &&
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
        mode: "ok",
        root,
        errors: ids,
        rootNamespace: fromString.root?.namespaceURI ?? null,
        deterministic,
        tokenDeterministic
      }
    };
  }

  if (allThrow) {
    const throwInfo = paths.map((pathResult) => pathResult.throwInfo);
    const baseline = throwInfo[0] ?? { parseErrorId: "unexpected-throw", details: null };

    const throwParity = throwInfo.every(
      (entryInfo) =>
        entryInfo.parseErrorId === baseline.parseErrorId &&
        JSON.stringify(entryInfo.details ?? null) === JSON.stringify(baseline.details ?? null)
    );

    const ids = sortIds([baseline.parseErrorId]);
    const expectedBudget = entry.expectedThrowBudget ?? null;
    const observedBudget = baseline.details?.budget ?? null;

    const budgetOk =
      expectedBudget === null ? true : baseline.parseErrorId === "budget-exceeded" && observedBudget === expectedBudget;

    const ok =
      throwParity &&
      budgetOk &&
      JSON.stringify(ids) === JSON.stringify(expectedErrors) &&
      (entry.expectedRoot ?? null) === null &&
      tokenDeterministic;

    return {
      id: entry.id,
      ok,
      expected: {
        root: entry.expectedRoot ?? null,
        errors: expectedErrors,
        rootNamespace: entry.expectedRootNamespace ?? null,
        throwBudget: expectedBudget
      },
      observed: {
        mode: "throw",
        root: null,
        errors: ids,
        rootNamespace: null,
        throwParity,
        throwInfo,
        tokenDeterministic
      }
    };
  }

  return {
    id: entry.id,
    ok: false,
    expected: {
      root: entry.expectedRoot ?? null,
      errors: expectedErrors,
      rootNamespace: entry.expectedRootNamespace ?? null
    },
    observed: {
      mode: "mixed",
      paths: paths.map((result) =>
        result.kind === "ok"
          ? { label: result.label, kind: "ok", determinismHash: result.document.determinismHash }
          : { label: result.label, kind: "throw", throwInfo: result.throwInfo }
      ),
      tokenDeterministic
    }
  };
}

const results = [];
for (const entry of cases) {
  results.push(await runCase(entry));
}

const failures = results.filter((entry) => !entry.ok);
const categoryStats = new Map();
for (const result of results) {
  const category = categoryForCaseId(result.id);
  const current = categoryStats.get(category) ?? { total: 0, pass: 0, fail: 0 };
  current.total += 1;
  if (result.ok) {
    current.pass += 1;
  } else {
    current.fail += 1;
  }
  categoryStats.set(category, current);
}

const categoryChecks = [...categoryStats.entries()]
  .map(([category, stats]) => {
    const minPassRate = CATEGORY_MIN_PASS_RATE[category] ?? 1;
    const passRate = stats.total === 0 ? 1 : stats.pass / stats.total;
    return {
      category,
      total: stats.total,
      pass: stats.pass,
      fail: stats.fail,
      passRate,
      minPassRate,
      ok: passRate >= minPassRate
    };
  })
  .sort((a, b) => a.category.localeCompare(b.category));

const report = {
  suite: "conformance-fixtures",
  timestamp: new Date().toISOString(),
  ok: failures.length === 0 && categoryChecks.every((entry) => entry.ok),
  caseCount: cases.length,
  passCount: results.length - failures.length,
  failCount: failures.length,
  categories: categoryChecks,
  failures,
  cases: results
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!report.ok) {
  console.error("Conformance fixtures check failed", JSON.stringify(failures, null, 2));
  process.exit(1);
}
