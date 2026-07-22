import assert from "node:assert/strict";
import test from "node:test";

import {
  compareJsrVersionMetadata,
  compareNpmProvenanceStatement,
  compareNpmVersionMetadata
} from "../scripts/release/registry-integrity.mjs";
import { waitForRegistryState } from "../scripts/release/registry-state.mjs";

test("registry metadata comparison rejects changed package content", () => {
  const npmExpected = {
    name: "@ismail-elkorchi/xml-parser",
    version: "0.2.0",
    integrity: "sha512-qualified"
  };
  const npmMetadata = {
    name: npmExpected.name,
    version: npmExpected.version,
    dist: {
      integrity: "sha512-different",
      attestations: {
        provenance: { predicateType: "https://slsa.dev/provenance/v1" }
      }
    }
  };
  assert.deepEqual(compareNpmVersionMetadata(npmMetadata, npmExpected).failures, ["integrity"]);

  const jsrExpected = {
    exports: { ".": "./jsr/mod.ts" },
    manifest: {
      "/jsr.json": { size: 100, checksum: "sha256-qualified" }
    }
  };
  const jsrMetadata = {
    exports: jsrExpected.exports,
    manifest: {
      "/jsr.json": { size: 100, checksum: "sha256-different" }
    }
  };
  assert.deepEqual(
    compareJsrVersionMetadata(jsrMetadata, jsrExpected).failures,
    ["manifest-file:/jsr.json"]
  );
});

test("npm provenance comparison binds the release workflow and source commit", () => {
  const expected = {
    name: "@ismail-elkorchi/xml-parser",
    version: "0.2.0",
    sha512: "qualified-sha512",
    repository: "https://github.com/Ismail-elkorchi/xml-parser",
    commit: "0123456789abcdef"
  };
  const statement = {
    subject: [{
      name: "pkg:npm/%40ismail-elkorchi/xml-parser@0.2.0",
      digest: { sha512: expected.sha512 }
    }],
    predicate: {
      buildDefinition: {
        externalParameters: {
          workflow: {
            repository: expected.repository,
            path: ".github/workflows/publish.yml"
          }
        },
        internalParameters: { github: { event_name: "release" } },
        resolvedDependencies: [{
          uri: `git+${expected.repository}@refs/tags/v0.2.0`,
          digest: { gitCommit: expected.commit }
        }]
      },
      runDetails: {
        builder: { id: "https://github.com/actions/runner/github-hosted" }
      }
    }
  };

  assert.deepEqual(compareNpmProvenanceStatement(statement, expected).failures, []);
  statement.predicate.buildDefinition.internalParameters.github.event_name = "workflow_dispatch";
  assert.deepEqual(compareNpmProvenanceStatement(statement, expected).failures, ["event"]);
});

test("registry polling retries only transient states", async () => {
  const states = [
    { state: "absent", failures: [] },
    { state: "pending", failures: ["provenance-unavailable"] },
    { state: "identical", failures: [] }
  ];
  let reads = 0;
  let clock = 0;
  const result = await waitForRegistryState(
    async () => states[Math.min(reads++, states.length - 1)],
    {
      waitMilliseconds: 100,
      initialDelayMilliseconds: 10,
      now: () => clock,
      sleep: async (milliseconds) => { clock += milliseconds; }
    }
  );

  assert.equal(result.state, "identical");
  assert.equal(reads, 3);
});
