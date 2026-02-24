import { decodeEntities } from "./entities.js";
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
  XmlToken,
  XmlTokenAttribute
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

function shiftSpan(span: XmlSpan, delta: number): XmlSpan {
  return {
    start: span.start + delta,
    end: span.end + delta,
    origin: span.origin
  };
}

function shiftAttribute(attribute: XmlTokenAttribute, delta: number): XmlTokenAttribute {
  return {
    qName: attribute.qName,
    value: attribute.value,
    span: shiftSpan(attribute.span, delta)
  };
}

function shiftToken(token: XmlToken, delta: number): XmlToken {
  switch (token.kind) {
    case "xml-declaration":
      return { ...token, start: token.start + delta, end: token.end + delta };
    case "start-tag":
      return {
        ...token,
        start: token.start + delta,
        end: token.end + delta,
        attributes: token.attributes.map((attribute) => shiftAttribute(attribute, delta))
      };
    case "end-tag":
    case "text":
    case "comment":
    case "cdata":
    case "doctype":
    case "processing-instruction":
      return { ...token, start: token.start + delta, end: token.end + delta };
  }
}

function shiftError(error: XmlParseError, delta: number): XmlParseError {
  return {
    ...error,
    offset: error.offset + delta
  };
}

function findMarkupEnd(buffer: string): number | null {
  if (buffer.startsWith("<!--")) {
    const end = buffer.indexOf("-->");
    return end < 0 ? null : end + 3;
  }

  if (buffer.startsWith("<![CDATA[")) {
    const end = buffer.indexOf("]]>");
    return end < 0 ? null : end + 3;
  }

  if (buffer.startsWith("<?")) {
    const end = buffer.indexOf("?>");
    return end < 0 ? null : end + 2;
  }

  let quote: string | null = null;
  for (let i = 1; i < buffer.length; i += 1) {
    const char = buffer[i];
    if (quote === null) {
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === ">") {
        return i + 1;
      }
      continue;
    }

    if (char === quote) {
      quote = null;
    }
  }

  return null;
}

function tokenizeXmlStreamChunks(
  decodedChunks: string[],
  options: XmlParseOptions,
  budgets: XmlParseBudgets,
  startTime: number
): { tokens: XmlToken[]; errors: XmlParseError[] } {
  const tokens: XmlToken[] = [];
  const errors: XmlParseError[] = [];
  let absoluteOffset = 0;
  let buffer = "";
  let pendingText = "";
  let pendingTextStart = 0;

  const appendText = (value: string): void => {
    if (value.length === 0) {
      return;
    }
    if (pendingText.length === 0) {
      pendingTextStart = absoluteOffset;
    }
    pendingText += value;
  };

  const flushPendingText = (): void => {
    if (pendingText.length === 0) {
      return;
    }

    const decoded = decodeEntities(pendingText, "", pendingTextStart, errors);
    tokens.push({
      kind: "text",
      value: decoded,
      start: pendingTextStart,
      end: pendingTextStart + pendingText.length
    });
    pendingText = "";
  };

  const processBuffer = (isFinal: boolean): void => {
    while (true) {
      assertBudget("maxTimeMs", budgets.maxTimeMs, Date.now() - startTime);
      assertBudget("maxErrors", budgets.maxErrors, errors.length);

      const bufferedBytes = asBytes(buffer) + asBytes(pendingText);
      assertBudget("maxStreamBytes", budgets.maxStreamBytes, bufferedBytes);

      if (buffer.length === 0) {
        return;
      }

      const lt = buffer.indexOf("<");
      if (lt < 0) {
        appendText(buffer);
        absoluteOffset += buffer.length;
        buffer = "";
        return;
      }

      if (lt > 0) {
        appendText(buffer.slice(0, lt));
        absoluteOffset += lt;
        buffer = buffer.slice(lt);
        continue;
      }

      const end = findMarkupEnd(buffer);
      if (end === null) {
        if (isFinal) {
          errors.push(createParseError("malformed-tag", "Unterminated markup in stream", "", absoluteOffset));
          appendText(buffer);
          absoluteOffset += buffer.length;
          buffer = "";
          flushPendingText();
        }
        return;
      }

      flushPendingText();
      const segment = buffer.slice(0, end);
      const segmentResult = tokenizeXml(segment, {
        allowDtd: options.allowDtd === true,
        allowExternalEntities: options.allowExternalEntities === true,
        maxErrors: budgets.maxErrors
      });

      for (const token of segmentResult.tokens) {
        tokens.push(shiftToken(token, absoluteOffset));
      }
      for (const error of segmentResult.errors) {
        errors.push(shiftError(error, absoluteOffset));
      }

      absoluteOffset += end;
      buffer = buffer.slice(end);
    }
  };

  for (const chunk of decodedChunks) {
    if (chunk.length === 0) {
      continue;
    }
    buffer += chunk;
    processBuffer(false);
  }

  processBuffer(true);
  flushPendingText();

  return { tokens, errors };
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
  const allowDtd = options.allowDtd === true;
  const allowExternalEntities = options.allowExternalEntities === true;

  assertBudget("maxInputBytes", budgets.maxInputBytes, asBytes(source));

  const tokenizeResult = tokenizeXml(source, {
    allowDtd,
    allowExternalEntities,
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
    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());

  const tokenized = tokenizeXmlStreamChunks(chunks, options, budgets, startTime);
  return buildDocumentFromTokens(null, tokenized, options, budgets, startTime);
}
