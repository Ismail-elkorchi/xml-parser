import type { BudgetCheck } from "./budgets.ts";
import { decodeEntities } from "./entities.ts";
import { XmlBudgetExceededError } from "../contracts/errors.ts";
import { createParseError } from "./parse-errors.ts";
import type {
  XmlParseError,
  XmlParseErrorId,
  XmlToken,
  XmlTokenAttribute,
  XmlTokenizationResult
} from "../contracts/types.ts";
import {
  isValidXmlQName,
  isXmlCharacter,
  isXmlWhitespace,
  normalizeLiteralAttributeWhitespace,
  readXmlName
} from "./xml-syntax.ts";

interface TokenizeOptions {
  readonly maxErrors: number;
  readonly maxAttributesPerElement: number;
  readonly checkTime: BudgetCheck;
}

interface XmlDeclarationFields {
  readonly valid: boolean;
  readonly version: string | null;
  readonly encoding: string | null;
  readonly standalone: "yes" | "no" | null;
}

export function tokenizeXml(source: string, options: TokenizeOptions): XmlTokenizationResult {
  const tokens: XmlToken[] = [];
  const errors: XmlParseError[] = [];
  let cursor = 0;

  const pushError = (parseErrorId: XmlParseErrorId, message: string, offset: number): void => {
    if (errors.length >= options.maxErrors) {
      throw new XmlBudgetExceededError("maxErrors", options.maxErrors, errors.length + 1);
    }
    errors.push(createParseError(parseErrorId, message, source, offset, options.checkTime));
  };

  validateXmlCharacters(source, pushError, options.checkTime);

  const emitText = (rawText: string, start: number, end: number): void => {
    if (rawText.includes("]]>")) {
      pushError(
        "cdata-close-in-character-data",
        "The CDATA closing delimiter is not allowed in character data",
        start + rawText.indexOf("]]>")
      );
    }
    tokens.push({
      kind: "text",
      value: decodeEntities(rawText, start, pushError, options.checkTime),
      start,
      end
    });
  };

  while (cursor < source.length) {
    options.checkTime();
    const lt = source.indexOf("<", cursor);
    if (lt < 0) {
      const rawText = source.slice(cursor);
      if (rawText.length > 0) {
        emitText(rawText, cursor, source.length);
      }
      break;
    }

    if (lt > cursor) {
      emitText(source.slice(cursor, lt), cursor, lt);
    }

    if (source.startsWith("<!--", lt)) {
      const end = source.indexOf("-->", lt + 4);
      if (end < 0) {
        pushError("malformed-comment", "Unterminated comment", lt);
        break;
      }
      const value = source.slice(lt + 4, end);
      if (value.includes("--") || value.endsWith("-")) {
        pushError("malformed-comment", "Comments must not contain -- or end with -", lt);
      }
      tokens.push({
        kind: "comment",
        value,
        start: lt,
        end: end + 3
      });
      cursor = end + 3;
      continue;
    }

    if (source.startsWith("<![CDATA[", lt)) {
      const end = source.indexOf("]]>", lt + 9);
      if (end < 0) {
        pushError("malformed-cdata", "Unterminated CDATA section", lt);
        break;
      }
      tokens.push({
        kind: "cdata",
        value: source.slice(lt + 9, end),
        start: lt,
        end: end + 3
      });
      cursor = end + 3;
      continue;
    }

    if (source.startsWith("<?", lt)) {
      const end = source.indexOf("?>", lt + 2);
      if (end < 0) {
        pushError("malformed-processing-instruction", "Unterminated processing instruction", lt);
        break;
      }

      const target = readXmlName(source, lt + 2, options.checkTime);
      if (target === null || (target.end < end && !isXmlWhitespace(source.charCodeAt(target.end)))) {
        pushError("malformed-processing-instruction", "Processing instruction target is invalid", lt);
        cursor = end + 2;
        continue;
      }

      const rawBody = source.slice(lt + 2, end);
      if (target.value.includes(":")) {
        pushError(
          "malformed-qualified-name",
          "Processing instruction targets cannot contain a namespace separator",
          lt + 2
        );
      }
      if (target.value.toLowerCase() === "xml") {
        if (target.value !== "xml") {
          pushError(
            "reserved-processing-instruction-target",
            "Processing instruction target xml is reserved in every case combination",
            lt
          );
          cursor = end + 2;
          continue;
        }

        if (lt !== 0) {
          pushError("xml-declaration-not-at-start", "XML declaration must appear at the start", lt);
        }
        const declaration = parseXmlDeclaration(rawBody);
        if (!declaration.valid) {
          pushError("malformed-xml-declaration", "XML declaration syntax is invalid", lt);
        }
        tokens.push({
          kind: "xml-declaration",
          raw: rawBody,
          start: lt,
          end: end + 2,
          version: declaration.version,
          encoding: declaration.encoding,
          standalone: declaration.standalone
        });
      } else {
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

    if (isDisabledDtdDeclaration(source, lt)) {
      const end = findDeclarationEnd(source, lt + 2, options.checkTime);
      if (end < 0) {
        pushError("malformed-declaration", "Unterminated declaration", lt);
        break;
      }
      const body = source.slice(lt + 2, end);
      pushError("disallowed-dtd", "DTD and entity declarations are disabled", lt);
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
      const nameStart = lt + 2;
      if (isXmlWhitespace(source.charCodeAt(nameStart))) {
        pushError("malformed-end-tag", "Whitespace after </ is not allowed", lt);
        cursor = recoverMarkupEnd(source, nameStart, options.checkTime);
        continue;
      }

      const name = readXmlName(source, nameStart, options.checkTime);
      if (name === null) {
        pushError("malformed-end-tag", "Invalid end tag name", lt);
        cursor = recoverMarkupEnd(source, nameStart, options.checkTime);
        continue;
      }
      if (!isValidXmlQName(name.value)) {
        pushError("malformed-qualified-name", `Invalid qualified name: ${name.value}`, nameStart);
      }

      const inner = skipWhitespace(source, name.end, options.checkTime);
      if (source.charCodeAt(inner) !== 0x3e) {
        pushError("malformed-end-tag", "Missing > for end tag", lt);
        cursor = recoverMarkupEnd(source, inner, options.checkTime);
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

    const markupCode = source.charCodeAt(lt + 1);
    if (markupCode !== 0x21 && markupCode !== 0x2f && markupCode !== 0x3f) {
      const nameStart = lt + 1;
      const name = readXmlName(source, nameStart, options.checkTime);
      if (name === null) {
        pushError("malformed-start-tag", "Invalid start tag name", lt);
        cursor = recoverMarkupEnd(source, nameStart, options.checkTime);
        continue;
      }
      if (!isValidXmlQName(name.value)) {
        pushError("malformed-qualified-name", `Invalid qualified name: ${name.value}`, nameStart);
      }

      let inner = name.end;
      const attributes: XmlTokenAttribute[] = [];
      const seenAttributes = new Set<string>();
      let selfClosing = false;
      let malformed = false;
      let terminated = false;

      while (inner < source.length) {
        options.checkTime();
        const beforeWhitespace = inner;
        inner = skipWhitespace(source, inner, options.checkTime);
        const hadWhitespace = inner > beforeWhitespace;
        const code = source.charCodeAt(inner);

        if (code === 0x2f && source.charCodeAt(inner + 1) === 0x3e) {
          selfClosing = true;
          terminated = true;
          inner += 2;
          break;
        }

        if (code === 0x3e) {
          terminated = true;
          inner += 1;
          break;
        }

        if (!hadWhitespace) {
          pushError("malformed-attribute", "Attributes must be separated from the preceding name or attribute by whitespace", inner);
          malformed = true;
          inner = recoverMarkupEnd(source, inner, options.checkTime);
          break;
        }

        const attrName = readXmlName(source, inner, options.checkTime);
        if (attrName === null) {
          pushError("malformed-attribute", "Invalid attribute name", inner);
          malformed = true;
          inner = recoverMarkupEnd(source, inner, options.checkTime);
          break;
        }
        if (!isValidXmlQName(attrName.value)) {
          pushError("malformed-qualified-name", `Invalid qualified name: ${attrName.value}`, inner);
        }

        const attributeStart = inner;
        inner = skipWhitespace(source, attrName.end, options.checkTime);
        if (source.charCodeAt(inner) !== 0x3d) {
          pushError("malformed-attribute", "Missing = in attribute", inner);
          malformed = true;
          inner = recoverMarkupEnd(source, inner, options.checkTime);
          break;
        }
        inner = skipWhitespace(source, inner + 1, options.checkTime);

        const quote = source.charCodeAt(inner);
        if (quote !== 0x22 && quote !== 0x27) {
          pushError("malformed-attribute", "Attribute value must be quoted", inner);
          malformed = true;
          inner = recoverMarkupEnd(source, inner, options.checkTime);
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
          pushError("duplicate-attribute", `Duplicate attribute: ${qName}`, attributeStart);
        } else {
          seenAttributes.add(qName);
        }

        const rawValue = source.slice(valueStart, valueEnd);
        const forbiddenLt = rawValue.indexOf("<");
        if (forbiddenLt >= 0) {
          pushError(
            "less-than-in-attribute-value",
            "Literal < is not allowed in attribute values",
            valueStart + forbiddenLt
          );
        }
        if (attributes.length >= options.maxAttributesPerElement) {
          throw new XmlBudgetExceededError(
            "maxAttributesPerElement",
            options.maxAttributesPerElement,
            attributes.length + 1
          );
        }
        attributes.push({
          qName,
          value: decodeEntities(
            normalizeLiteralAttributeWhitespace(rawValue),
            valueStart,
            pushError,
            options.checkTime
          ),
          span: {
            start: attributeStart,
            end: valueEnd + 1,
            origin: "input"
          }
        });
        inner = valueEnd + 1;
      }

      if (!terminated && !malformed) {
        pushError("malformed-start-tag", "Unterminated start tag", lt);
        malformed = true;
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
      }
      cursor = inner;
      continue;
    }

    pushError("malformed-tag", "Unsupported markup declaration", lt);
    cursor = recoverMarkupEnd(source, lt + 1, options.checkTime);
  }

  options.checkTime();
  return { tokens, errors };
}

function isDisabledDtdDeclaration(source: string, start: number): boolean {
  const keywordLength = source.startsWith("<!DOCTYPE", start)
    ? "<!DOCTYPE".length
    : source.startsWith("<!ENTITY", start)
      ? "<!ENTITY".length
      : 0;
  return keywordLength > 0 && isXmlWhitespace(source.charCodeAt(start + keywordLength));
}

function validateXmlCharacters(
  source: string,
  reportError: (parseErrorId: XmlParseErrorId, message: string, offset: number) => void,
  checkTime: BudgetCheck
): void {
  for (let offset = 0; offset < source.length;) {
    if ((offset & 1023) === 0) {
      checkTime();
    }
    const codePoint = source.codePointAt(offset);
    if (codePoint === undefined) {
      break;
    }
    if (!isXmlCharacter(codePoint)) {
      reportError(
        "invalid-xml-character",
        `Character U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} is not legal in XML 1.0`,
        offset
      );
    }
    offset += codePoint > 0xffff ? 2 : 1;
  }
}

function skipWhitespace(source: string, start: number, checkTime: BudgetCheck): number {
  let cursor = start;
  while (cursor < source.length && isXmlWhitespace(source.charCodeAt(cursor))) {
    if ((cursor & 1023) === 0) {
      checkTime();
    }
    cursor += 1;
  }
  return cursor;
}

function recoverMarkupEnd(source: string, start: number, checkTime: BudgetCheck): number {
  let quote = 0;
  for (let cursor = start; cursor < source.length; cursor += 1) {
    if ((cursor & 1023) === 0) {
      checkTime();
    }
    const code = source.charCodeAt(cursor);
    if (quote !== 0) {
      if (code === quote) {
        quote = 0;
      }
      continue;
    }
    if (code === 0x22 || code === 0x27) {
      quote = code;
    } else if (code === 0x3e) {
      return cursor + 1;
    }
  }
  return source.length;
}

function findDeclarationEnd(source: string, start: number, checkTime: BudgetCheck): number {
  let quote = 0;
  let subsetDepth = 0;
  for (let cursor = start; cursor < source.length; cursor += 1) {
    if ((cursor & 1023) === 0) {
      checkTime();
    }
    const code = source.charCodeAt(cursor);
    if (quote !== 0) {
      if (code === quote) {
        quote = 0;
      }
      continue;
    }
    if (code === 0x22 || code === 0x27) {
      quote = code;
    } else if (code === 0x5b) {
      subsetDepth += 1;
    } else if (code === 0x5d && subsetDepth > 0) {
      subsetDepth -= 1;
    } else if (code === 0x3e && subsetDepth === 0) {
      return cursor;
    }
  }
  return -1;
}

function parseXmlDeclaration(rawBody: string): XmlDeclarationFields {
  let cursor = 3;
  let valid = rawBody.startsWith("xml") && isXmlWhitespace(rawBody.charCodeAt(cursor));
  cursor = skipDeclarationWhitespace(rawBody, cursor);

  const version = readPseudoAttribute(rawBody, cursor, "version");
  if (version === null || !/^1\.[0-9]+$/.test(version.value)) {
    return { valid: false, version: version?.value ?? null, encoding: null, standalone: null };
  }
  cursor = version.end;

  let encoding: string | null = null;
  let standalone: "yes" | "no" | null = null;
  let next = skipDeclarationWhitespace(rawBody, cursor);
  const hadSeparator = next > cursor;

  if (rawBody.startsWith("encoding", next)) {
    if (!hadSeparator) valid = false;
    const parsedEncoding = readPseudoAttribute(rawBody, next, "encoding");
    if (parsedEncoding === null || !/^[A-Za-z][A-Za-z0-9._-]*$/.test(parsedEncoding.value)) {
      return { valid: false, version: version.value, encoding: parsedEncoding?.value ?? null, standalone: null };
    }
    encoding = parsedEncoding.value;
    cursor = parsedEncoding.end;
    next = skipDeclarationWhitespace(rawBody, cursor);
  }

  if (rawBody.startsWith("standalone", next)) {
    if (next === cursor) valid = false;
    const parsedStandalone = readPseudoAttribute(rawBody, next, "standalone");
    if (parsedStandalone === null || (parsedStandalone.value !== "yes" && parsedStandalone.value !== "no")) {
      return {
        valid: false,
        version: version.value,
        encoding,
        standalone: null
      };
    }
    standalone = parsedStandalone.value;
    cursor = parsedStandalone.end;
    next = skipDeclarationWhitespace(rawBody, cursor);
  }

  if (next !== rawBody.length) {
    valid = false;
  }
  return { valid, version: version.value, encoding, standalone };
}

function readPseudoAttribute(
  source: string,
  start: number,
  expectedName: string
): { readonly value: string; readonly end: number } | null {
  if (!source.startsWith(expectedName, start)) {
    return null;
  }
  let cursor = skipDeclarationWhitespace(source, start + expectedName.length);
  if (source.charCodeAt(cursor) !== 0x3d) {
    return null;
  }
  cursor = skipDeclarationWhitespace(source, cursor + 1);
  const quote = source.charCodeAt(cursor);
  if (quote !== 0x22 && quote !== 0x27) {
    return null;
  }
  const valueStart = cursor + 1;
  const valueEnd = source.indexOf(String.fromCharCode(quote), valueStart);
  if (valueEnd < 0) {
    return null;
  }
  return {
    value: source.slice(valueStart, valueEnd),
    end: valueEnd + 1
  };
}

function skipDeclarationWhitespace(source: string, start: number): number {
  let cursor = start;
  while (cursor < source.length && isXmlWhitespace(source.charCodeAt(cursor))) {
    cursor += 1;
  }
  return cursor;
}
