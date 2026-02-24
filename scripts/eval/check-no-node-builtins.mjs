import fs from "node:fs/promises";
import path from "node:path";

const srcRoot = new URL("../../src/", import.meta.url);
const reportPath = new URL("../../reports/no-node-builtins.json", import.meta.url);

const banned = new Set([
  "fs",
  "path",
  "crypto",
  "node:fs",
  "node:path",
  "node:crypto",
  "node:child_process",
  "node:worker_threads",
  "node:os",
  "node:url"
]);

async function collectTsFiles(dirUrl, out) {
  const entries = await fs.readdir(dirUrl, { withFileTypes: true });
  for (const entry of entries) {
    const nextUrl = new URL(entry.name, dirUrl);
    if (entry.isDirectory()) {
      await collectTsFiles(new URL(`${entry.name}/`, dirUrl), out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".ts")) {
      out.push(nextUrl);
    }
  }
}

const files = [];
await collectTsFiles(srcRoot, files);

const violations = [];
for (const fileUrl of files) {
  const body = await fs.readFile(fileUrl, "utf8");
  const importMatches = body.matchAll(/from\s+["']([^"']+)["']/g);
  for (const match of importMatches) {
    const specifier = match[1];
    if (banned.has(specifier)) {
      violations.push({
        file: path.relative(process.cwd(), fileUrl.pathname),
        specifier
      });
    }
  }
}

const ok = violations.length === 0;
const report = {
  suite: "no-node-builtins",
  timestamp: new Date().toISOString(),
  ok,
  violations
};

await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!ok) {
  console.error("Node builtins detected in src/:", JSON.stringify(violations, null, 2));
  process.exit(1);
}
