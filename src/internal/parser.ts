import { stableHash } from "./hash.js";
import { createParseError, XmlBudgetExceededError } from "./parse-errors.js";
import { tokenizeXml } from "./tokenizer.js";
import type {
  XmlAttribute,
  XmlDocument,
  XmlElementNode,
  XmlParseBudgets,
  XmlParseError,
  XmlParseOptions,
  XmlSpan,
  XmlTextNode,
  XmlToken
} from "./types.js";

const XML_NS = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";

export const DEFAULT_BUDGETS: XmlParseBudgets = {
  maxInputBytes: 1_000_000,
  maxStreamBytes: 1_000_000,
  maxNodes: 50_000,
  maxDepth: 256,
  maxAttributesPerElement: 256,
  maxTextBytes: 1_000_000,
  maxErrors: 1_000,
  maxTimeMs: 2_000
};

function getBudgets(options: XmlParseOptions): XmlParseBudgets {
  return {
    ...DEFAULT_BUDGETS,
    ...options.budgets
  };
}

function splitQName(qName: string): { prefix: string | null; localName: string } {
  const index = qName.indexOf(":");
  if (index < 0) {
    return {
      prefix: null,
      localName: qName
    };
  }
  return {
    prefix: qName.slice(0, index),
    localName: qName.slice(index + 1)
  };
}

function inputSpan(start: number, end: number): XmlSpan {
  return {
    start,
    end,
    origin: "input"
  };
}

function asBytes(input: string): number {
  return new TextEncoder().encode(input).length;
}

function assertBudget(
  budget: keyof XmlParseBudgets,
  limit: number,
  observed: number
): void {
  if (observed > limit) {
    throw new XmlBudgetExceededError({
      budget,
      limit,
      observed
    });
  }
}

function hasMeaningfulText(value: string): boolean {
  return value.trim().length > 0;
}

function createNamespaceRoot(): Map<string, string> {
  return new Map<string, string>([
    ["xml", XML_NS],
    ["xmlns", XMLNS_NS]
  ]);
}

function buildDocumentFromTokens(
  source: string | null,
  tokenizeResult: { tokens: XmlToken[]; errors: XmlParseError[] },
  options: XmlParseOptions,
  budgets: XmlParseBudgets,
  startTime: number
): XmlDocument {
  const strict = options.strict !== false;
  const errors: XmlParseError[] = [...tokenizeResult.errors];

  const pushError = (parseErrorId: string, message: string, offset: number): void => {
    if (errors.length >= budgets.maxErrors) {
      assertBudget("maxErrors", budgets.maxErrors, errors.length + 1);
    }
    errors.push(createParseError(parseErrorId, message, source ?? "", offset));
  };

  const rootContext = createNamespaceRoot();
  const contextStack: Map<string, string>[] = [rootContext];
  const openStack: XmlElementNode[] = [];

  let root: XmlElementNode | null = null;
  let nextNodeId = 1;
  let nodeCount = 0;
  let textBytes = 0;

  const touchNode = (): number => {
    nodeCount += 1;
    assertBudget("maxNodes", budgets.maxNodes, nodeCount);
    return nextNodeId++;
  };

  const checkTime = (): void => {
    const elapsed = Date.now() - startTime;
    assertBudget("maxTimeMs", budgets.maxTimeMs, elapsed);
  };

  for (const token of tokenizeResult.tokens) {
    checkTime();

    if (token.kind === "xml-declaration" || token.kind === "comment") {
      continue;
    }

    if (token.kind === "doctype" || token.kind === "processing-instruction") {
      if (strict) {
        pushError("unsupported-declaration", "Declaration type not supported in strict mode", token.start);
      }
      continue;
    }

    if (token.kind === "text" || token.kind === "cdata") {
      if (token.value.length === 0) {
        continue;
      }

      if (openStack.length === 0) {
        if (hasMeaningfulText(token.value)) {
          pushError("text-outside-root", "Text outside root element", token.start);
        }
        continue;
      }

      textBytes += asBytes(token.value);
      assertBudget("maxTextBytes", budgets.maxTextBytes, textBytes);

      const textNode: XmlTextNode = {
        kind: "text",
        nodeId: touchNode(),
        value: token.value,
        span: inputSpan(token.start, token.end)
      };

      const parent = openStack[openStack.length - 1];
      if (parent) {
        parent.children.push(textNode);
      }
      continue;
    }

    if (token.kind === "start-tag") {
      assertBudget("maxAttributesPerElement", budgets.maxAttributesPerElement, token.attributes.length);

      const parentContext = contextStack[contextStack.length - 1];
      const localContext = new Map(parentContext);
      for (const attr of token.attributes) {
        if (attr.qName === "xmlns") {
          localContext.set("", attr.value);
        } else if (attr.qName.startsWith("xmlns:")) {
          const declaredPrefix = attr.qName.slice("xmlns:".length);
          if (declaredPrefix === "xmlns") {
            pushError("namespace-prefix-redefined", "Prefix xmlns is reserved", attr.span.start);
          } else if (declaredPrefix === "xml" && attr.value !== XML_NS) {
            pushError("namespace-prefix-redefined", "Prefix xml must map to XML namespace", attr.span.start);
          } else {
            localContext.set(declaredPrefix, attr.value);
          }
        }
      }

      const elementName = splitQName(token.qName);
      const elementNamespace = elementName.prefix
        ? (localContext.get(elementName.prefix) ?? null)
        : (localContext.get("") ?? null);

      if (elementName.prefix && elementNamespace === null) {
        pushError(
          "namespace-prefix-undefined",
          `Undefined namespace prefix: ${elementName.prefix}`,
          token.start
        );
      }

      const attributes: XmlAttribute[] = token.attributes.map((attr) => {
        const split = splitQName(attr.qName);
        let namespaceURI: string | null = null;
        if (attr.qName === "xmlns" || attr.qName.startsWith("xmlns:")) {
          namespaceURI = XMLNS_NS;
        } else if (split.prefix) {
          namespaceURI = localContext.get(split.prefix) ?? null;
          if (namespaceURI === null) {
            pushError(
              "namespace-prefix-undefined",
              `Undefined namespace prefix: ${split.prefix}`,
              attr.span.start
            );
          }
        }

        return {
          qName: attr.qName,
          localName: split.localName,
          prefix: split.prefix,
          namespaceURI,
          value: attr.value,
          span: attr.span
        };
      });

      const element: XmlElementNode = {
        kind: "element",
        nodeId: touchNode(),
        qName: token.qName,
        localName: elementName.localName,
        prefix: elementName.prefix,
        namespaceURI: elementNamespace,
        attributes,
        children: [],
        span: inputSpan(token.start, token.end),
        startTagSpan: inputSpan(token.start, token.end),
        endTagSpan: token.selfClosing ? inputSpan(token.start, token.end) : null
      };

      if (openStack.length > 0) {
        const parent = openStack[openStack.length - 1];
        if (parent) {
          parent.children.push(element);
        }
      } else if (root === null) {
        root = element;
      } else {
        pushError("multiple-root-elements", "Multiple root elements are not allowed", token.start);
      }

      if (!token.selfClosing) {
        openStack.push(element);
        contextStack.push(localContext);
        assertBudget("maxDepth", budgets.maxDepth, openStack.length);
      }
      continue;
    }

    if (token.kind === "end-tag") {
      if (openStack.length === 0) {
        pushError("unexpected-end-tag", `Unexpected end tag: ${token.qName}`, token.start);
        continue;
      }

      let matchIndex = -1;
      for (let index = openStack.length - 1; index >= 0; index -= 1) {
        const candidate = openStack[index];
        if (candidate && candidate.qName === token.qName) {
          matchIndex = index;
          break;
        }
      }

      if (matchIndex < 0) {
        pushError("unexpected-end-tag", `Unexpected end tag: ${token.qName}`, token.start);
        continue;
      }

      while (openStack.length - 1 > matchIndex) {
        const dangling = openStack.pop();
        contextStack.pop();
        if (dangling) {
          pushError("mismatched-end-tag", `Mismatched end tag for ${dangling.qName}`, token.start);
          dangling.endTagSpan = inputSpan(token.start, token.end);
          dangling.span.end = token.end;
        }
      }

      const node = openStack.pop();
      contextStack.pop();
      if (node) {
        node.endTagSpan = inputSpan(token.start, token.end);
        node.span.end = token.end;
      }
    }
  }

  while (openStack.length > 0) {
    const dangling = openStack.pop();
    contextStack.pop();
    if (dangling) {
      const endOffset = source === null ? dangling.span.end : (source?.length ?? 0);
      pushError("unclosed-tag", `Unclosed tag: ${dangling.qName}`, endOffset);
      dangling.endTagSpan = inputSpan(endOffset, endOffset);
      dangling.span.end = endOffset;
    }
  }

  if (root === null) {
    pushError("no-root-element", "No root element found", 0);
  }

  const doc: XmlDocument = {
    kind: "document",
    source,
    root,
    errors,
    tokens: tokenizeResult.tokens,
    determinismHash: ""
  };

  doc.determinismHash = stableHash({
    root,
    errors,
    tokens: doc.tokens
  });

  return doc;
}

export function parseXmlSource(input: string, options: XmlParseOptions = {}): XmlDocument {
  const source = String(input ?? "");
  const budgets = getBudgets(options);
  const startTime = Date.now();

  assertBudget("maxInputBytes", budgets.maxInputBytes, asBytes(source));

  const tokenizeResult = tokenizeXml(source, {
    maxErrors: budgets.maxErrors
  });

  return buildDocumentFromTokens(source, tokenizeResult, options, budgets, startTime);
}

export function parseXmlBytesSource(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  const decoder = new TextDecoder();
  return parseXmlSource(decoder.decode(input), options);
}

export async function parseXmlStreamSource(
  stream: ReadableStream<Uint8Array>,
  options: XmlParseOptions = {}
): Promise<XmlDocument> {
  const budgets = getBudgets(options);
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const startTime = Date.now();
  const chunks: string[] = [];
  let consumedBytes = 0;

  while (true) {
    assertBudget("maxTimeMs", budgets.maxTimeMs, Date.now() - startTime);

    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }

    consumedBytes += value.byteLength;
    assertBudget("maxInputBytes", budgets.maxInputBytes, consumedBytes);
    assertBudget("maxStreamBytes", budgets.maxStreamBytes, consumedBytes);
    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());

  const source = chunks.join("");
  const tokenized = tokenizeXml(source, {
    maxErrors: budgets.maxErrors
  });
  const document = buildDocumentFromTokens(source, tokenized, options, budgets, startTime);
  document.source = null;
  return document;
}
