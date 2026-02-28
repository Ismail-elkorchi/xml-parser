import { decodeEntities } from "./entities.js";
import { createParseError } from "./parse-errors.js";
import type { XmlParseError, XmlToken, XmlTokenAttribute } from "./types.js";

interface TokenizeOptions {
  maxErrors: number;
}

export interface TokenizeResult {
  tokens: XmlToken[];
  errors: XmlParseError[];
}

function isWhitespace(code: number): boolean {
  return code === 9 || code === 10 || code === 13 || code === 32;
}

function isNameStart(code: number): boolean {
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code === 95 ||
    code === 58
  );
}

function isNameChar(code: number): boolean {
  return isNameStart(code) || (code >= 48 && code <= 57) || code === 45 || code === 46;
}

function skipWhitespace(source: string, start: number): number {
  let cursor = start;
  while (cursor < source.length && isWhitespace(source.charCodeAt(cursor))) {
    cursor += 1;
  }
  return cursor;
}

function readName(source: string, start: number): { value: string; end: number } | null {
  if (start >= source.length || !isNameStart(source.charCodeAt(start))) {
    return null;
  }

  let cursor = start + 1;
  while (cursor < source.length && isNameChar(source.charCodeAt(cursor))) {
    cursor += 1;
  }

  return {
    value: source.slice(start, cursor),
    end: cursor
  };
}

function parseXmlDeclaration(raw: string): { version: string | null; encoding: string | null } {
  const versionMatch = raw.match(/\bversion\s*=\s*["']([^"']+)["']/i);
  const encodingMatch = raw.match(/\bencoding\s*=\s*["']([^"']+)["']/i);
  return {
    version: versionMatch?.[1] ?? null,
    encoding: encodingMatch?.[1] ?? null
  };
}

function tryPushError(
  errors: XmlParseError[],
  source: string,
  parseErrorId: string,
  message: string,
  offset: number,
  maxErrors: number
): boolean {
  if (errors.length >= maxErrors) {
    return false;
  }
  errors.push(createParseError(parseErrorId, message, source, offset));
  return true;
}

export function tokenizeXml(source: string, options: TokenizeOptions): TokenizeResult {
  const tokens: XmlToken[] = [];
  const errors: XmlParseError[] = [];
  let cursor = 0;
  let seenContent = false;

  const pushError = (parseErrorId: string, message: string, offset: number): boolean =>
    tryPushError(errors, source, parseErrorId, message, offset, options.maxErrors);

  while (cursor < source.length) {
    const lt = source.indexOf("<", cursor);
    if (lt < 0) {
      const rawText = source.slice(cursor);
      if (rawText.length > 0) {
        tokens.push({
          kind: "text",
          value: decodeEntities(rawText, source, cursor, errors),
          start: cursor,
          end: source.length
        });
      }
      break;
    }

    if (lt > cursor) {
      const rawText = source.slice(cursor, lt);
      tokens.push({
        kind: "text",
        value: decodeEntities(rawText, source, cursor, errors),
        start: cursor,
        end: lt
      });
      if (rawText.trim().length > 0) {
        seenContent = true;
      }
    }

    if (source.startsWith("<!--", lt)) {
      const end = source.indexOf("-->", lt + 4);
      if (end < 0) {
        pushError("malformed-comment", "Unterminated comment", lt);
        break;
      }
      tokens.push({
        kind: "comment",
        value: source.slice(lt + 4, end),
        start: lt,
        end: end + 3
      });
      cursor = end + 3;
      continue;
    }

    if (source.startsWith("<![CDATA[", lt)) {
      const end = source.indexOf("]]>", lt + 9);
      if (end < 0) {
        pushError("malformed-cdata", "Unterminated CDATA", lt);
        break;
      }
      tokens.push({
        kind: "cdata",
        value: source.slice(lt + 9, end),
        start: lt,
        end: end + 3
      });
      cursor = end + 3;
      seenContent = true;
      continue;
    }

    if (source.startsWith("<?", lt)) {
      const end = source.indexOf("?>", lt + 2);
      if (end < 0) {
        pushError("malformed-processing-instruction", "Unterminated processing instruction", lt);
        break;
      }

      const rawBody = source.slice(lt + 2, end);
      if (rawBody.trim().startsWith("xml")) {
        if (seenContent || lt !== 0) {
          pushError("xml-declaration-not-at-start", "XML declaration must appear at start", lt);
        }
        const parsed = parseXmlDeclaration(rawBody);
        tokens.push({
          kind: "xml-declaration",
          raw: rawBody,
          start: lt,
          end: end + 2,
          version: parsed.version,
          encoding: parsed.encoding
        });
      } else {
        pushError("unsupported-processing-instruction", "Processing instructions are not supported", lt);
        tokens.push({
          kind: "processing-instruction",
          value: rawBody,
          start: lt,
          end: end + 2
        });
      }
      cursor = end + 2;
      continue;
    }

    if (source.startsWith("<!DOCTYPE", lt) || source.startsWith("<!ENTITY", lt)) {
      const end = source.indexOf(">", lt + 2);
      if (end < 0) {
        pushError("malformed-declaration", "Unterminated declaration", lt);
        break;
      }
      const body = source.slice(lt + 2, end);
      const hasExternalRef = /\bSYSTEM\b|\bPUBLIC\b/i.test(body);
      pushError("disallowed-dtd", "DTD declarations are disabled", lt);
      if (hasExternalRef) {
        pushError("disallowed-external-entity", "External entities are disabled", lt);
      }

      tokens.push({
        kind: "doctype",
        value: body,
        start: lt,
        end: end + 1
      });
      cursor = end + 1;
      continue;
    }

    if (source.startsWith("</", lt)) {
      const innerStart = lt + 2;
      if (isWhitespace(source.charCodeAt(innerStart))) {
        pushError("malformed-end-tag", "Whitespace after </ is not allowed", lt);
        const gt = source.indexOf(">", innerStart);
        cursor = gt < 0 ? source.length : gt + 1;
        continue;
      }

      let inner = innerStart;
      const name = readName(source, inner);
      if (!name) {
        pushError("malformed-end-tag", "Invalid end tag name", lt);
        const gt = source.indexOf(">", lt + 2);
        cursor = gt < 0 ? source.length : gt + 1;
        continue;
      }
      inner = skipWhitespace(source, name.end);
      if (source.charCodeAt(inner) !== 62) {
        pushError("malformed-end-tag", "Missing > for end tag", lt);
        const gt = source.indexOf(">", inner);
        cursor = gt < 0 ? source.length : gt + 1;
        continue;
      }
      tokens.push({
        kind: "end-tag",
        qName: name.value,
        start: lt,
        end: inner + 1
      });
      cursor = inner + 1;
      continue;
    }

    if (source.charCodeAt(lt + 1) !== 33 && source.charCodeAt(lt + 1) !== 47 && source.charCodeAt(lt + 1) !== 63) {
      let inner = skipWhitespace(source, lt + 1);
      const name = readName(source, inner);
      if (!name) {
        pushError("malformed-start-tag", "Invalid start tag name", lt);
        const gt = source.indexOf(">", lt + 1);
        cursor = gt < 0 ? source.length : gt + 1;
        continue;
      }

      inner = name.end;
      const attributes: XmlTokenAttribute[] = [];
      const seenAttributes = new Set<string>();
      let selfClosing = false;
      let malformed = false;

      while (inner < source.length) {
        inner = skipWhitespace(source, inner);
        const code = source.charCodeAt(inner);

        if (code === 47 && source.charCodeAt(inner + 1) === 62) {
          selfClosing = true;
          inner += 2;
          break;
        }

        if (code === 62) {
          inner += 1;
          break;
        }

        const attrName = readName(source, inner);
        if (!attrName) {
          pushError("malformed-attribute", "Invalid attribute name", inner);
          malformed = true;
          const gt = source.indexOf(">", inner);
          inner = gt < 0 ? source.length : gt + 1;
          break;
        }

        inner = skipWhitespace(source, attrName.end);
        if (source.charCodeAt(inner) !== 61) {
          pushError("malformed-attribute", "Missing = in attribute", inner);
          malformed = true;
          const gt = source.indexOf(">", inner);
          inner = gt < 0 ? source.length : gt + 1;
          break;
        }
        inner = skipWhitespace(source, inner + 1);

        const quote = source.charCodeAt(inner);
        if (quote !== 34 && quote !== 39) {
          pushError("malformed-attribute", "Attribute value must be quoted", inner);
          malformed = true;
          const gt = source.indexOf(">", inner);
          inner = gt < 0 ? source.length : gt + 1;
          break;
        }

        const valueStart = inner + 1;
        const valueEnd = source.indexOf(String.fromCharCode(quote), valueStart);
        if (valueEnd < 0) {
          pushError("malformed-attribute", "Unterminated attribute value", inner);
          malformed = true;
          inner = source.length;
          break;
        }

        const qName = attrName.value;
        if (seenAttributes.has(qName)) {
          pushError("duplicate-attribute", `Duplicate attribute: ${qName}`, attrName.end);
        } else {
          seenAttributes.add(qName);
        }

        const rawValue = source.slice(valueStart, valueEnd);
        attributes.push({
          qName,
          value: decodeEntities(rawValue, source, valueStart, errors),
          span: {
            start: attrName.end - qName.length,
            end: valueEnd + 1,
            origin: "input"
          }
        });
        inner = valueEnd + 1;
      }

      if (!malformed) {
        tokens.push({
          kind: "start-tag",
          qName: name.value,
          attributes,
          selfClosing,
          start: lt,
          end: inner
        });
        seenContent = true;
      }
      cursor = inner;
      continue;
    }

    pushError("malformed-tag", "Unsupported markup declaration", lt);
    cursor = lt + 1;
  }

  return { tokens, errors };
}
