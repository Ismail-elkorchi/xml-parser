import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workspace = await mkdtemp(join(tmpdir(), "xml-parser-package-"));

try {
  const packOutput = execFileSync("npm", ["pack", "--json", "--pack-destination", workspace], {
    encoding: "utf8"
  });
  const [manifest] = JSON.parse(packOutput);
  if (!manifest || typeof manifest.filename !== "string" || !Array.isArray(manifest.files)) {
    throw new Error("npm pack did not return a usable package manifest");
  }

  const paths = new Set(manifest.files.map((entry) => entry.path));
  for (const required of ["package.json", "README.md", "LICENSE", "dist/mod.js", "dist/mod.d.ts"]) {
    if (!paths.has(required)) throw new Error(`packed package is missing ${required}`);
  }
  for (const path of paths) {
    if (path.startsWith("src/") || path.startsWith("test/") || path.startsWith("scripts/")) {
      throw new Error(`packed package contains development file ${path}`);
    }
  }

  const consumer = join(workspace, "consumer");
  await mkdir(consumer);
  await writeFile(join(consumer, "package.json"), '{"private":true,"type":"module"}\n', "utf8");
  const tarball = join(workspace, manifest.filename);
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    { cwd: consumer, stdio: "inherit" }
  );

  await writeFile(
    join(consumer, "runtime.mjs"),
    [
      'import { parseXml, serializeXml, tokenizeXml } from "@ismail-elkorchi/xml-parser";',
      'const document = parseXml("<root/>");',
      'if (document.errors.length !== 0 || serializeXml(document) !== "<root/>") throw new Error("runtime package smoke failed");',
      'if (tokenizeXml("<root/>").tokens.length !== 1) throw new Error("tokenizer package smoke failed");',
      ""
    ].join("\n"),
    "utf8"
  );
  execFileSync(process.execPath, [join(consumer, "runtime.mjs")], { stdio: "inherit" });

  await writeFile(
    join(consumer, "contract.ts"),
    [
      'import { parseXml, type XmlDocument, type XmlParseErrorId } from "@ismail-elkorchi/xml-parser";',
      'const document: XmlDocument = parseXml("<root/>");',
      'const diagnostic: XmlParseErrorId = "malformed-start-tag";',
      "void document;",
      "void diagnostic;",
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        noEmit: true,
        strict: true,
        skipLibCheck: false,
        target: "ES2023",
        types: []
      },
      include: ["contract.ts"]
    }),
    "utf8"
  );
  execFileSync(
    process.execPath,
    [resolve("node_modules/typescript/bin/tsc"), "-p", join(consumer, "tsconfig.json")],
    { stdio: "inherit" }
  );

  const installedManifest = JSON.parse(
    await readFile(join(consumer, "node_modules/@ismail-elkorchi/xml-parser/package.json"), "utf8")
  );
  if (Object.keys(installedManifest.dependencies ?? {}).length > 0) {
    throw new Error("packed package contains runtime dependencies");
  }
  process.stdout.write(`package qualification passed: ${installedManifest.name}@${installedManifest.version}\n`);
} finally {
  await rm(workspace, { force: true, recursive: true });
}
