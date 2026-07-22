import {
  getParseErrorSpecRef,
  parseXml,
  tokenizeXml,
  type XmlDocument,
  type XmlParseErrorId,
  type XmlTokenizationResult,
  type XmlTokenizeOptions,
  type XmlValidationProfile
} from "../src/mod.ts";

const document: XmlDocument = parseXml("<root/>");
const tokenization: XmlTokenizationResult = tokenizeXml("<root/>");
const diagnostic: XmlParseErrorId = "malformed-start-tag";
const profile: XmlValidationProfile = { requiredElementQNames: ["root"] };
const tokenizeOptions: XmlTokenizeOptions = { budgets: { maxErrors: 2 } };

void tokenization.tokens;
void getParseErrorSpecRef(diagnostic);
void profile;
void tokenizeOptions;

// @ts-expect-error Public parse results are readonly.
document.errors.push({});
// @ts-expect-error Internal result hashes are not part of parsed documents.
document.determinismHash;
// @ts-expect-error Removed permissive parsing modes must not return through the type surface.
parseXml("<root/>", { strict: false });
// @ts-expect-error Specification references accept only known diagnostics.
getParseErrorSpecRef("unknown-diagnostic");
// @ts-expect-error Tree limits do not silently apply to standalone tokenization.
tokenizeXml("<root/>", { budgets: { maxNodes: 1 } });
