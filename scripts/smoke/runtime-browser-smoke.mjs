import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, normalize, resolve } from "node:path";

import { chromium } from "playwright";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

function parseArgs(argv) {
  let reportPath = "reports/browser-smoke.json";
  for (const arg of argv) {
    if (arg.startsWith("--report=")) {
      reportPath = arg.slice("--report=".length);
    }
  }
  return { reportPath };
}

function createStaticServer(rootDir) {
  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
      const unsafePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
      const absolutePath = resolve(rootDir, `.${unsafePath}`);
      if (!absolutePath.startsWith(rootDir)) {
        response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
        response.end("forbidden");
        return;
      }
      if (pathname === "/index.html") {
        response.writeHead(200, { "content-type": MIME_TYPES[".html"] });
        response.end("<!doctype html><meta charset=\"utf-8\"><title>xml-browser-smoke</title>", "utf8");
        return;
      }

      const content = await readFile(absolutePath);
      const contentType = MIME_TYPES[extname(absolutePath)] ?? "application/octet-stream";
      response.writeHead(200, { "content-type": contentType });
      response.end(content);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : null;
      if (code === "ENOENT") {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("not found");
        return;
      }
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end("internal error");
    }
  });
}

async function runBrowserSmoke(baseUrl) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });

    const smoke = await page.evaluate(async () => {
      const mod = await import("/dist/mod.js");
      const xml = "<root xmlns:n=\"urn:n\"><n:item id=\"1\">alpha</n:item><n:item id=\"2\"><![CDATA[x<y]]></n:item></root>";
      const bytes = new TextEncoder().encode(xml);
      const stream = new globalThis.ReadableStream({
        start(controller) {
          controller.enqueue(bytes.subarray(0, 17));
          controller.enqueue(bytes.subarray(17, 45));
          controller.enqueue(bytes.subarray(45));
          controller.close();
        }
      });

      const fromString = mod.parseXml(xml);
      const fromBytes = mod.parseXmlBytes(bytes);
      const fromStream = await mod.parseXmlStream(stream);
      const serialized = mod.serializeXml(fromString);
      const reparsed = mod.parseXml(serialized);
      const tokens = mod.tokenizeXml(xml);

      const checks = {
        exportsPresent:
          typeof mod.parseXml === "function" &&
          typeof mod.parseXmlBytes === "function" &&
          typeof mod.parseXmlStream === "function" &&
          typeof mod.serializeXml === "function" &&
          typeof mod.tokenizeXml === "function",
        parseXml: fromString.errors.length === 0,
        parseXmlBytes: fromBytes.errors.length === 0,
        parseXmlStream: fromStream.errors.length === 0,
        serializeXml: typeof serialized === "string" && serialized.includes("<root"),
        tokenizeXml: Array.isArray(tokens) && tokens.length > 0,
        determinism:
          fromString.determinismHash === fromBytes.determinismHash &&
          fromString.determinismHash === fromStream.determinismHash,
        roundtrip: reparsed.errors.length === 0
      };

      const stablePayload = {
        root: fromString.root?.qName ?? null,
        hash: fromString.determinismHash,
        tokenCount: tokens.length,
        serialized
      };

      const digestBuffer = await globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(stablePayload))
      );
      const hash = Array.from(new Uint8Array(digestBuffer), (value) => value.toString(16).padStart(2, "0")).join("");

      return {
        ok: Object.values(checks).every((value) => value === true),
        checks,
        determinismHash: fromString.determinismHash,
        hash,
        userAgent: globalThis.navigator.userAgent
      };
    });

    return {
      ok: smoke.ok,
      checks: smoke.checks,
      determinismHash: smoke.determinismHash,
      hash: smoke.hash,
      userAgent: smoke.userAgent,
      version: browser.version()
    };
  } finally {
    await page.close();
    await browser.close();
  }
}

async function main() {
  const { reportPath } = parseArgs(process.argv.slice(2));
  const rootDir = resolve(".");

  const server = createStaticServer(rootDir);
  await new Promise((resolvePromise) => {
    server.listen(0, "127.0.0.1", resolvePromise);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve browser smoke server address");
    }

    const smoke = await runBrowserSmoke(`http://127.0.0.1:${String(address.port)}`);
    const report = {
      suite: "browser-smoke",
      timestamp: new Date().toISOString(),
      runtime: "browser",
      ok: smoke.ok,
      version: smoke.version,
      userAgent: smoke.userAgent,
      hash: smoke.hash,
      determinismHash: smoke.determinismHash,
      checks: smoke.checks
    };

    const reportAbsolutePath = resolve(reportPath);
    await mkdir(dirname(reportAbsolutePath), { recursive: true });
    await writeFile(reportAbsolutePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    if (!report.ok) {
      throw new Error("browser smoke checks failed");
    }
    process.stdout.write(`browser smoke passed: ${reportPath}\n`);
  } finally {
    await new Promise((resolvePromise, rejectPromise) => {
      server.close((error) => {
        if (error) {
          rejectPromise(error);
          return;
        }
        resolvePromise();
      });
    });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
