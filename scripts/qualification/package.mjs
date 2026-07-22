import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";

const workspace = await mkdtemp(join(tmpdir(), "xml-parser-package-"));
const reportPath = resolve("reports/package.json");
const artifactDirectory = process.env["XML_PARSER_PACKAGE_ARTIFACT_DIRECTORY"] === undefined
  ? undefined
  : resolve(process.env["XML_PARSER_PACKAGE_ARTIFACT_DIRECTORY"]);

async function writeReport(report) {
  await mkdir(resolve("reports"), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

try {
  const [packageManifest, packageLock, jsrManifest] = await Promise.all([
    readFile("package.json", "utf8").then(JSON.parse),
    readFile("package-lock.json", "utf8").then(JSON.parse),
    readFile("jsr.json", "utf8").then(JSON.parse)
  ]);
  if (
    packageManifest.name !== jsrManifest.name ||
    packageManifest.version !== jsrManifest.version ||
    packageManifest.version !== packageLock.version ||
    packageManifest.version !== packageLock.packages?.[""]?.version
  ) {
    throw new Error("package, lockfile, and JSR manifests must identify the same package version");
  }
  const runtimeDependencies = Object.keys(packageManifest.dependencies ?? {}).sort();
  const lockedRuntimeDependencies = Object.keys(
    packageLock.packages?.[""]?.dependencies ?? {}
  ).sort();
  if (runtimeDependencies.length > 0 || lockedRuntimeDependencies.length > 0) {
    throw new Error("published package must not contain runtime dependencies");
  }

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
  if (
    installedManifest.name !== packageManifest.name ||
    installedManifest.version !== packageManifest.version
  ) {
    throw new Error("installed package identity differs from the qualified manifests");
  }

  const tarballBytes = await readFile(tarball);
  const sha256 = createHash("sha256").update(tarballBytes).digest("hex");
  if (typeof manifest.integrity !== "string" || !manifest.integrity.startsWith("sha512-")) {
    throw new Error("npm pack did not report SHA-512 integrity for the package artifact");
  }
  if (artifactDirectory !== undefined) {
    const relativeArtifactDirectory = relative(process.cwd(), artifactDirectory);
    if (
      relativeArtifactDirectory === "" ||
      (!relativeArtifactDirectory.startsWith(`..${sep}`) && relativeArtifactDirectory !== "..")
    ) {
      throw new Error("publication artifacts must be preserved outside the checkout");
    }
    await mkdir(artifactDirectory, { recursive: true });
    await copyFile(tarball, join(artifactDirectory, manifest.filename));
  }

  await writeReport({
    schemaVersion: 1,
    suite: "xml-parser-package",
    generatedAt: new Date().toISOString(),
    ok: true,
    package: {
      name: packageManifest.name,
      version: packageManifest.version
    },
    tarball: {
      name: manifest.filename,
      bytes: tarballBytes.byteLength,
      sha256,
      integrity: manifest.integrity,
      files: manifest.files.length
    },
    runtimeDependencies,
    lockedRuntimeDependencies,
    installed: {
      runtimeConsumer: "pass",
      strictTypeScriptConsumer: "pass"
    }
  });
  process.stdout.write(`package qualification passed: ${installedManifest.name}@${installedManifest.version}\n`);
} catch (error) {
  await writeReport({
    schemaVersion: 1,
    suite: "xml-parser-package",
    generatedAt: new Date().toISOString(),
    ok: false,
    failures: [error instanceof Error ? `${error.name}: ${error.message}` : String(error)]
  });
  throw error;
} finally {
  await rm(workspace, { force: true, recursive: true });
}
