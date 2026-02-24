import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

import { parseXml } from "../../dist/mod.js";

const fixturePath = new URL("../../test/fixtures/conformance/cases.json", import.meta.url);
const reportPath = new URL("../../reports/oracle-independent.json", import.meta.url);

const NON_GOAL_PARSE_ERROR_IDS = new Set([
  "disallowed-dtd",
  "disallowed-external-entity",
  "unsupported-declaration",
  "unsupported-processing-instruction"
]);

function pythonCheckWellFormed(xmlSource) {
  const code = [
    "import sys",
    "import xml.etree.ElementTree as ET",
    "xml_input = sys.stdin.read()",
    "try:",
    "    ET.fromstring(xml_input)",
    "    print('1')",
    "except Exception:",
    "    print('0')"
  ].join("\n");

  const result = spawnSync("python3", ["-c", code], {
    input: xmlSource,
    encoding: "utf8"
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  if ((result.status ?? 1) !== 0) {
    return { ok: false, error: (result.stderr || "python parse check failed").trim() };
  }

  return { ok: true, wellFormed: (result.stdout || "").trim() === "1" };
}

function parserWellFormed(xmlSource) {
  try {
    const parsed = parseXml(xmlSource);
    const fatalErrors = parsed.errors.filter((entry) => !NON_GOAL_PARSE_ERROR_IDS.has(entry.parseErrorId));
    return {
      ok: true,
      wellFormed: fatalErrors.length === 0,
      parseErrorIds: parsed.errors.map((entry) => entry.parseErrorId)
    };
  } catch (error) {
    const parseErrorId =
      error && typeof error === "object" && "parseErrorId" in error && typeof error.parseErrorId === "string"
        ? error.parseErrorId
        : "unexpected-throw";

    return {
      ok: true,
      wellFormed: false,
      parseErrorIds: [parseErrorId]
    };
  }
}

function resolvePythonFingerprint() {
  const executable = spawnSync("python3", ["-c", "import sys; print(sys.executable)"], {
    encoding: "utf8"
  });
  const version = spawnSync("python3", ["--version"], {
    encoding: "utf8"
  });

  if (executable.error || (executable.status ?? 1) !== 0 || version.error || (version.status ?? 1) !== 0) {
    return {
      available: false,
      reason:
        executable.error?.message ||
        version.error?.message ||
        (executable.stderr || version.stderr || "python3 not available").trim()
    };
  }

  const executablePath = (executable.stdout || "").trim();
  const versionText = `${version.stdout || ""}${version.stderr || ""}`.trim();

  return {
    available: true,
    executablePath,
    version: versionText
  };
}

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

async function main() {
  const fixtureDoc = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  const conformanceCases = fixtureDoc.cases ?? [];

  const fingerprint = resolvePythonFingerprint();
  if (!fingerprint.available) {
    const report = {
      suite: "oracle-independent",
      timestamp: new Date().toISOString(),
      ok: false,
      available: false,
      reason: fingerprint.reason,
      compared: 0,
      excludedCount: conformanceCases.length,
      excludedCaseIds: conformanceCases.map((entry) => entry.id),
      mismatches: []
    };
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.error("independent oracle unavailable", report.reason);
    process.exit(1);
  }

  const pythonBinary = await fs.readFile(fingerprint.executablePath);
  const executableSha256 = sha256Hex(pythonBinary);

  const comparableCases = conformanceCases.filter((entry) => !entry.options);
  const excludedCaseIds = conformanceCases.filter((entry) => entry.options).map((entry) => entry.id);

  const mismatches = [];
  for (const entry of comparableCases) {
    const oracle = pythonCheckWellFormed(entry.xml);
    if (!oracle.ok) {
      mismatches.push({
        id: entry.id,
        reason: oracle.error,
        parserWellFormed: null,
        oracleWellFormed: null,
        parserErrorIds: []
      });
      continue;
    }

    const parser = parserWellFormed(entry.xml);
    if (!parser.ok || parser.wellFormed !== oracle.wellFormed) {
      mismatches.push({
        id: entry.id,
        parserWellFormed: parser.ok ? parser.wellFormed : null,
        oracleWellFormed: oracle.wellFormed,
        parserErrorIds: parser.parseErrorIds ?? []
      });
    }
  }

  const report = {
    suite: "oracle-independent",
    timestamp: new Date().toISOString(),
    ok: mismatches.length === 0 && comparableCases.length > 0,
    available: true,
    oracle: {
      tool: "python-xml.etree",
      version: fingerprint.version,
      executablePath: path.resolve(fingerprint.executablePath),
      executableSha256
    },
    compared: comparableCases.length,
    excludedCount: excludedCaseIds.length,
    excludedCaseIds,
    nonGoalParseErrorIds: [...NON_GOAL_PARSE_ERROR_IDS],
    mismatches
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (!report.ok) {
    console.error("independent oracle check failed", JSON.stringify(report, null, 2));
    process.exit(1);
  }
}

await main();
