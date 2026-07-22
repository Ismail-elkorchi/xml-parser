import { execFileSync } from "node:child_process";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

await rm("dist", { force: true, recursive: true });
execFileSync("tsc", ["-p", "tsconfig.build.json"], { stdio: "inherit" });
await rewriteDeclarationImports("dist");

async function rewriteDeclarationImports(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteDeclarationImports(path);
      continue;
    }
    if (!entry.name.endsWith(".d.ts")) continue;
    const source = await readFile(path, "utf8");
    const rewritten = source.replace(/(from\s+["'][^"']+)\.ts(["'])/gu, "$1.js$2");
    if (rewritten !== source) await writeFile(path, rewritten);
  }
}
