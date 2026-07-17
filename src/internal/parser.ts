import {
  assertBudget,
  createTimeBudgetCheck,
  monotonicNow,
  resolveBudgets,
  type BudgetCheck,
  utf8ByteLength
} from "./budgets.js";
import { stableHash } from "./hash.js";
import { XmlDecodingError, createParseError } from "./parse-errors.js";
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
import { containsNonXmlWhitespace, normalizeXmlLineEndings } from "./xml-syntax.js";

const XML_NS = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";

function splitQName(qName: string): { readonly prefix: string | null; readonly localName: string } {
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

function createNamespaceRoot(): Map<string, string> {
  return new Map<string, string>([
    ["xml", XML_NS],
    ["xmlns", XMLNS_NS]
  ]);
}

function resolveNamespace(context: Map<string, string>, prefix: string): string | null {
  const value = context.get(prefix);
  return value === undefined || value.length === 0 ? null : value;
}

function buildDocumentFromTokens(
  source: string,
  documentSource: string | null,
  tokenizeResult: { readonly tokens: XmlToken[]; readonly errors: XmlParseError[] },
  budgets: XmlParseBudgets,
  checkTime: BudgetCheck
): XmlDocument {
  const errors: XmlParseError[] = [...tokenizeResult.errors];

  const pushError = (parseErrorId: string, message: string, offset: number): void => {
    if (errors.length >= budgets.maxErrors) {
      assertBudget("maxErrors", budgets.maxErrors, errors.length + 1);
    }
    errors.push(createParseError(parseErrorId, message, source, offset, checkTime));
  };

  const contextStack: Map<string, string>[] = [createNamespaceRoot()];
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

  for (const token of tokenizeResult.tokens) {
    checkTime();

    if (
      token.kind === "xml-declaration" ||
      token.kind === "comment" ||
      token.kind === "doctype" ||
      token.kind === "processing-instruction"
    ) {
      continue;
    }

    if (token.kind === "text" || token.kind === "cdata") {
      if (token.value.length === 0) {
        continue;
      }

      if (openStack.length === 0) {
        if (containsNonXmlWhitespace(token.value)) {
          pushError("text-outside-root", "Text outside root element", token.start);
        }
        continue;
      }

      textBytes += utf8ByteLength(token.value);
      assertBudget("maxTextBytes", budgets.maxTextBytes, textBytes);

      const textNode: XmlTextNode = {
        kind: "text",
        nodeId: touchNode(),
        value: token.value,
        span: inputSpan(token.start, token.end)
      };

      openStack[openStack.length - 1]?.children.push(textNode);
      continue;
    }

    if (token.kind === "start-tag") {
      assertBudget("maxAttributesPerElement", budgets.maxAttributesPerElement, token.attributes.length);

      const parentContext = contextStack[contextStack.length - 1] ?? createNamespaceRoot();
      const localContext = new Map(parentContext);
      for (const attr of token.attributes) {
        if (attr.qName === "xmlns") {
          if (attr.value === XML_NS || attr.value === XMLNS_NS) {
            pushError("namespace-name-reserved", "The default namespace cannot use a reserved namespace name", attr.span.start);
          }
          if (attr.value.length === 0) {
            localContext.delete("");
          } else {
            localContext.set("", attr.value);
          }
          continue;
        }
        if (!attr.qName.startsWith("xmlns:")) {
          continue;
        }

        const declaredPrefix = attr.qName.slice("xmlns:".length);
        if (declaredPrefix === "xmlns") {
          pushError("namespace-prefix-reserved", "Prefix xmlns cannot be declared", attr.span.start);
        } else if (declaredPrefix === "xml" && attr.value !== XML_NS) {
          pushError("namespace-prefix-reserved", "Prefix xml must map to the XML namespace", attr.span.start);
        } else if (declaredPrefix !== "xml" && attr.value === XML_NS) {
          pushError("namespace-name-reserved", "Only prefix xml may map to the XML namespace", attr.span.start);
        }
        if (attr.value === XMLNS_NS) {
          pushError("namespace-name-reserved", "The xmlns namespace name cannot be declared", attr.span.start);
        }
        if (attr.value.length === 0) {
          pushError("namespace-prefix-undeclared", "Namespace prefixes cannot be undeclared in Namespaces in XML 1.0", attr.span.start);
          localContext.delete(declaredPrefix);
        } else {
          localContext.set(declaredPrefix, attr.value);
        }
      }

      const elementName = splitQName(token.qName);
      if (elementName.prefix === "xmlns") {
        pushError("namespace-prefix-reserved", "Element names cannot use the xmlns prefix", token.start);
      }
      const elementNamespace = elementName.prefix
        ? resolveNamespace(localContext, elementName.prefix)
        : resolveNamespace(localContext, "");

      if (elementName.prefix && elementNamespace === null) {
        pushError(
          "namespace-prefix-undefined",
          `Undefined namespace prefix: ${elementName.prefix}`,
          token.start
        );
      }

      const expandedAttributeNames = new Set<string>();
      const attributeQNames = new Set<string>();
      const attributes: XmlAttribute[] = token.attributes.map((attr) => {
        const duplicateQName = attributeQNames.has(attr.qName);
        attributeQNames.add(attr.qName);
        const split = splitQName(attr.qName);
        const namespaceDeclaration = attr.qName === "xmlns" || attr.qName.startsWith("xmlns:");
        let namespaceURI: string | null = null;
        if (namespaceDeclaration) {
          namespaceURI = XMLNS_NS;
        } else if (split.prefix) {
          namespaceURI = resolveNamespace(localContext, split.prefix);
          if (namespaceURI === null) {
            pushError(
              "namespace-prefix-undefined",
              `Undefined namespace prefix: ${split.prefix}`,
              attr.span.start
            );
          }
        }

        if (!namespaceDeclaration && !duplicateQName) {
          const expandedName = `${namespaceURI ?? ""}\u0000${split.localName}`;
          if (expandedAttributeNames.has(expandedName)) {
            pushError(
              "duplicate-expanded-attribute",
              `Duplicate expanded attribute name: ${attr.qName}`,
              attr.span.start
            );
          } else {
            expandedAttributeNames.add(expandedName);
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
        openStack[openStack.length - 1]?.children.push(element);
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
        checkTime();
        if (openStack[index]?.qName === token.qName) {
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
    checkTime();
    const dangling = openStack.pop();
    contextStack.pop();
    if (dangling) {
      pushError("unclosed-tag", `Unclosed tag: ${dangling.qName}`, source.length);
      dangling.endTagSpan = inputSpan(source.length, source.length);
      dangling.span.end = source.length;
    }
  }

  if (root === null) {
    pushError("no-root-element", "No root element found", 0);
  }

  const doc: XmlDocument = {
    kind: "document",
    source: documentSource,
    root,
    errors,
    tokens: tokenizeResult.tokens,
    determinismHash: ""
  };

  checkTime();
  doc.determinismHash = stableHash({ root, errors, tokens: doc.tokens }, checkTime);
  checkTime();
  return doc;
}

function parseDecodedSource(
  decodedSource: string,
  documentSource: "retain" | "discard",
  byteLength: number,
  budgets: XmlParseBudgets,
  checkTime: BudgetCheck
): XmlDocument {
  assertBudget("maxInputBytes", budgets.maxInputBytes, byteLength);
  checkTime();
  const source = normalizeXmlLineEndings(decodedSource);
  checkTime();
  const tokenized = tokenizeXml(source, {
    maxErrors: budgets.maxErrors,
    checkTime
  });
  checkTime();
  return buildDocumentFromTokens(
    source,
    documentSource === "retain" ? source : null,
    tokenized,
    budgets,
    checkTime
  );
}

export function parseXmlSource(input: string, options: XmlParseOptions = {}): XmlDocument {
  const budgets = resolveBudgets(options);
  const startedAt = monotonicNow();
  const checkTime = createTimeBudgetCheck(budgets.maxTimeMs, startedAt);
  const byteLength = utf8ByteLength(input);
  return parseDecodedSource(input, "retain", byteLength, budgets, checkTime);
}

export function tokenizeXmlSource(input: string, options: XmlParseOptions = {}): XmlToken[] {
  const budgets = resolveBudgets(options);
  const startedAt = monotonicNow();
  const checkTime = createTimeBudgetCheck(budgets.maxTimeMs, startedAt);
  assertBudget("maxInputBytes", budgets.maxInputBytes, utf8ByteLength(input));
  checkTime();
  const source = normalizeXmlLineEndings(input);
  const result = tokenizeXml(source, {
    maxErrors: budgets.maxErrors,
    checkTime
  });
  checkTime();
  return result.tokens;
}

export function parseXmlBytesSource(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  const budgets = resolveBudgets(options);
  const startedAt = monotonicNow();
  const checkTime = createTimeBudgetCheck(budgets.maxTimeMs, startedAt);
  assertBudget("maxInputBytes", budgets.maxInputBytes, input.byteLength);
  const source = decodeUtf8(new TextDecoder("utf-8", { fatal: true }), input, false);
  checkTime();
  return parseDecodedSource(source, "retain", input.byteLength, budgets, checkTime);
}

export async function parseXmlStreamSource(
  stream: ReadableStream<Uint8Array>,
  options: XmlParseOptions = {}
): Promise<XmlDocument> {
  const budgets = resolveBudgets(options);
  const startedAt = monotonicNow();
  const checkTime = createTimeBudgetCheck(budgets.maxTimeMs, startedAt);
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const chunks: string[] = [];
  let consumedBytes = 0;

  try {
    for (;;) {
      checkTime();
      const { done, value } = await reader.read();
      checkTime();
      if (done) {
        break;
      }

      consumedBytes += value.byteLength;
      assertBudget("maxInputBytes", budgets.maxInputBytes, consumedBytes);
      assertBudget("maxStreamBytes", budgets.maxStreamBytes, consumedBytes);
      chunks.push(decodeUtf8(decoder, value, true));
    }

    chunks.push(decodeUtf8(decoder, undefined, false));
    checkTime();
    return parseDecodedSource(chunks.join(""), "discard", consumedBytes, budgets, checkTime);
  } catch (error) {
    try {
      await reader.cancel(error);
    } catch {
      // Preserve the original read, decode, or parse failure.
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function decodeUtf8(
  decoder: TextDecoder,
  input: Uint8Array | undefined,
  stream: boolean
): string {
  try {
    return input === undefined ? decoder.decode() : decoder.decode(input, { stream });
  } catch {
    throw new XmlDecodingError();
  }
}
