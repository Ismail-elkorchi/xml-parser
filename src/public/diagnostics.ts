import { stableHash } from "../internal/hash.js";
import { parseXmlBytesSource, parseXmlSource } from "../internal/parser.js";
import type {
  XmlDocument,
  XmlElementNode,
  XmlNode,
  XmlParseOptions,
  XmlReplayContract,
  XmlReplayEvent,
  XmlReplayInput,
  XmlReplayOptions,
  XmlReplayVerificationResult,
  XmlToken
} from "../internal/types.js";

function asDocument(input: XmlReplayInput, options: XmlParseOptions): XmlDocument {
  if (typeof input === "string") {
    return parseXmlSource(input, options);
  }
  if (input instanceof Uint8Array) {
    return parseXmlBytesSource(input, options);
  }
  return input;
}

function sourceKind(input: XmlReplayInput): XmlReplayContract["sourceKind"] {
  if (typeof input === "string") {
    return "string";
  }
  if (input instanceof Uint8Array) {
    return "bytes";
  }
  return "document";
}

function eventFromToken(seq: number, token: XmlToken): XmlReplayEvent {
  let qName: string | null = null;
  const tokenKind = token.kind;
  if (token.kind === "start-tag" || token.kind === "end-tag") {
    qName = token.qName;
  }

  return {
    seq,
    kind: "token",
    tokenKind,
    qName,
    start: token.start,
    end: token.end
  };
}

function* walkNodes(root: XmlElementNode): Generator<XmlNode> {
  yield root;
  for (const child of root.children) {
    if (child.kind === "element") {
      yield* walkNodes(child);
      continue;
    }
    yield child;
  }
}

function nodeCount(root: XmlElementNode | null): number {
  if (!root) {
    return 0;
  }
  let count = 0;
  for (const node of walkNodes(root)) {
    void node;
    count += 1;
  }
  return count;
}

function eventFromNode(seq: number, node: XmlNode): XmlReplayEvent {
  if (node.kind === "text") {
    return {
      seq,
      kind: "tree-node",
      nodeKind: node.kind,
      nodeId: node.nodeId,
      qName: null,
      spanStart: node.span.start,
      spanEnd: node.span.end
    };
  }

  return {
    seq,
    kind: "tree-node",
    nodeKind: node.kind,
    nodeId: node.nodeId,
    qName: node.qName,
    spanStart: node.span.start,
    spanEnd: node.span.end
  };
}

function inputHash(input: XmlReplayInput): string {
  if (typeof input === "string") {
    return stableHash({
      kind: "string",
      value: input
    });
  }
  if (input instanceof Uint8Array) {
    return stableHash({
      kind: "bytes",
      value: [...input]
    });
  }
  return stableHash({
    kind: "document",
    determinismHash: input.determinismHash
  });
}

function optionsHash(options: XmlParseOptions): string {
  return stableHash({
    strict: options.strict ?? true,
    budgets: options.budgets ?? {}
  });
}

function buildEvents(document: XmlDocument): XmlReplayEvent[] {
  const events: XmlReplayEvent[] = [];
  let seq = 1;

  for (const token of document.tokens) {
    events.push(eventFromToken(seq, token));
    seq += 1;
  }

  for (const parseError of document.errors) {
    events.push({
      seq,
      kind: "parse-error",
      parseErrorId: parseError.parseErrorId,
      offset: parseError.offset,
      line: parseError.line,
      column: parseError.column
    });
    seq += 1;
  }

  if (document.root) {
    for (const node of walkNodes(document.root)) {
      events.push(eventFromNode(seq, node));
      seq += 1;
    }
  }

  return events;
}

function applyMaxEvents(document: XmlDocument, events: XmlReplayEvent[], maxEvents: number | undefined): {
  events: XmlReplayEvent[];
  truncated: boolean;
} {
  const summaryBase = {
    kind: "summary" as const,
    nodeCount: nodeCount(document.root),
    tokenCount: document.tokens.length,
    parseErrorCount: document.errors.length,
    determinismHash: document.determinismHash,
    truncated: false
  };

  if (maxEvents === undefined || maxEvents <= 0) {
    const summary: XmlReplayEvent = {
      seq: events.length + 1,
      ...summaryBase
    };
    return {
      events: [...events, summary],
      truncated: false
    };
  }

  if (maxEvents === 1) {
    return {
      events: [
        {
          seq: 1,
          ...summaryBase,
          truncated: true
        } satisfies XmlReplayEvent
      ],
      truncated: true
    };
  }

  const cap = Math.max(1, maxEvents - 1);
  const trimmed = events.slice(0, cap);
  const truncated = events.length > cap;
  const summary: XmlReplayEvent = {
    seq: trimmed.length + 1,
    ...summaryBase,
    truncated
  };

  return {
    events: [...trimmed, summary],
    truncated
  };
}/**
 * Computes deterministic public output for `createXmlReplayContract`.
 */


export function createXmlReplayContract(
  input: XmlReplayInput,
  options: XmlReplayOptions = {}
): XmlReplayContract {
  const parseOptions = options.parse ?? {};
  const document = asDocument(input, parseOptions);
  const source = sourceKind(input);
  const inHash = inputHash(input);
  const optHash = optionsHash(parseOptions);
  const baseEvents = buildEvents(document);
  const bounded = applyMaxEvents(document, baseEvents, options.maxEvents);

  const replayCore = {
    contract: "xml-replay-v1" as const,
    sourceKind: source,
    inputHash: inHash,
    optionsHash: optHash,
    determinismHash: document.determinismHash,
    events: bounded.events,
    truncated: bounded.truncated
  };

  return {
    ...replayCore,
    replayHash: stableHash(replayCore)
  };
}/**
 * Verifies public invariants for `verifyXmlReplayContract` deterministically.
 */


export function verifyXmlReplayContract(
  input: XmlReplayInput,
  expected: XmlReplayContract,
  options: XmlReplayOptions = {}
): XmlReplayVerificationResult {
  const observed = createXmlReplayContract(input, options);
  const ok = observed.replayHash === expected.replayHash;
  return {
    ok,
    expectedReplayHash: expected.replayHash,
    observedReplayHash: observed.replayHash,
    mismatch: ok ? null : "replay-hash-mismatch"
  };
}
