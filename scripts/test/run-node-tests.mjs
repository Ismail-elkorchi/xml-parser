import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  throw new Error("run-node-tests: provide at least one test directory");
}

const files = roots.flatMap((root) => findTests(resolve(root))).sort();
if (files.length === 0) {
  throw new Error(`run-node-tests: no test files found under ${roots.join(", ")}`);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
});
if (result.error !== undefined) throw result.error;
if (result.signal !== null) {
  throw new Error(`node --test terminated by ${result.signal}`);
}
process.exitCode = result.status ?? 1;

function findTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findTests(path);
    return entry.isFile() && entry.name.endsWith(".test.mjs") ? [path] : [];
  });
}
