import fs from "node:fs/promises";

import { parseXml, XmlBudgetExceededError } from "../../dist/mod.js";

const reportPath = new URL("../../reports/security-adversarial.json", import.meta.url);
const fixturePath = new URL("../../test/fixtures/security/adversarial.json", import.meta.url);

const fixtureDoc = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const corpusCases = fixtureDoc.cases ?? [];

function sortIds(ids) {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function runCorpusCase(entry) {
  const options = entry.options ?? {};

  try {
    const parsed = parseXml(entry.xml, options);
    const observed = sortIds(parsed.errors.map((item) => item.parseErrorId));

    if (entry.expectedThrowBudget) {
      return {
        id: entry.id,
        ok: false,
        expectedThrowBudget: entry.expectedThrowBudget,
        observedErrorIds: observed
      };
    }

    const expected = sortIds(entry.expectedErrorIds ?? []);
    const ok = JSON.stringify(expected) === JSON.stringify(observed);

    return {
      id: entry.id,
      ok,
      expectedErrorIds: expected,
      observedErrorIds: observed
    };
  } catch (error) {
    if (!(error instanceof XmlBudgetExceededError)) {
      return {
        id: entry.id,
        ok: false,
        expectedThrowBudget: entry.expectedThrowBudget ?? null,
        observedThrow: "unexpected"
      };
    }

    const ok = entry.expectedThrowBudget === error.details.budget;
    return {
      id: entry.id,
      ok,
      expectedThrowBudget: entry.expectedThrowBudget ?? null,
      observedThrowBudget: error.details.budget
    };
  }
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateFuzzCase(rand, index) {
  const tags = ["a", "b", "n", "x", "item", "node"];
  const textTokens = ["alpha", "beta", "&amp;", "&bogus;", "<![CDATA[x<y]]>", "<!--c-->"];
  const depth = 1 + Math.floor(rand() * 8);
  let xml = "";

  for (let i = 0; i < depth; i += 1) {
    const tag = tags[Math.floor(rand() * tags.length)];
    const withAttr = rand() > 0.55;
    if (withAttr) {
      xml += `<${tag} id="${index}-${i}">`;
    } else {
      xml += `<${tag}>`;
    }

    if (rand() > 0.5) {
      xml += textTokens[Math.floor(rand() * textTokens.length)];
    }
  }

  for (let i = depth - 1; i >= 0; i -= 1) {
    const tag = tags[i % tags.length];
    xml += `</${tag}>`;
  }

  if (rand() > 0.7) {
    xml += "<broken";
  }

  return xml;
}

const fuzzSeed = 20260224;
const fuzzRuns = 500;
const fuzzRand = createRng(fuzzSeed);
const fuzzOutcomes = {
  total: fuzzRuns,
  crashCount: 0,
  budgetThrowCount: 0,
  parseErrorCount: 0,
  topSlowest: []
};

const parseErrorFrequency = new Map();
for (let i = 0; i < fuzzRuns; i += 1) {
  const xml = generateFuzzCase(fuzzRand, i);
  const start = Date.now();

  try {
    const parsed = parseXml(xml, {
      budgets: {
        maxInputBytes: 20_000,
        maxNodes: 5_000,
        maxDepth: 64,
        maxTimeMs: 200,
        maxTextBytes: 5_000,
        maxErrors: 1_000
      }
    });

    for (const err of parsed.errors) {
      parseErrorFrequency.set(err.parseErrorId, (parseErrorFrequency.get(err.parseErrorId) ?? 0) + 1);
      fuzzOutcomes.parseErrorCount += 1;
    }
  } catch (error) {
    if (error instanceof XmlBudgetExceededError) {
      fuzzOutcomes.budgetThrowCount += 1;
    } else {
      fuzzOutcomes.crashCount += 1;
    }
  }

  const durationMs = Date.now() - start;
  fuzzOutcomes.topSlowest.push({ id: `fuzz-${i}`, durationMs });
}

fuzzOutcomes.topSlowest.sort((a, b) => b.durationMs - a.durationMs);
fuzzOutcomes.topSlowest = fuzzOutcomes.topSlowest.slice(0, 10);

const corpusResults = corpusCases.map((entry) => runCorpusCase(entry));
const corpusFailures = corpusResults.filter((entry) => !entry.ok);
const uniqueParseErrorIds = parseErrorFrequency.size;

const limits = {
  minFuzzRuns: 500,
  maxCrashCount: 0,
  minUniqueParseErrorIds: 5
};

const checks = {
  corpusFailures: corpusFailures.length === 0,
  fuzzRunCount: fuzzOutcomes.total >= limits.minFuzzRuns,
  crashCount: fuzzOutcomes.crashCount <= limits.maxCrashCount,
  parseErrorCoverage: uniqueParseErrorIds >= limits.minUniqueParseErrorIds
};

const ok = Object.values(checks).every((entry) => entry === true);
const report = {
  suite: "security-adversarial",
  timestamp: new Date().toISOString(),
  ok,
  limits,
  checks,
  corpus: {
    total: corpusCases.length,
    pass: corpusResults.length - corpusFailures.length,
    fail: corpusFailures.length,
    failures: corpusFailures
  },
  fuzz: {
    seed: fuzzSeed,
    ...fuzzOutcomes,
    uniqueParseErrorIds,
    parseErrorFrequency: Object.fromEntries([...parseErrorFrequency.entries()].sort((a, b) => b[1] - a[1]))
  }
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Security adversarial check failed", JSON.stringify(report, null, 2));
  process.exit(1);
}
