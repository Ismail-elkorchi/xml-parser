/**
 * Namespace-aware XML parsing, serialization, querying, and structural validation.
 *
 * @example
 * ```ts
 * import { parseXml } from "./mod.ts";
 *
 * const document = parseXml("<root><item/></root>");
 * console.log(document.root?.qName);
 * ```
 *
 * @module
 */

export * from "../src/mod.ts";
