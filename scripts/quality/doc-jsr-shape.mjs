export function collectDocSymbols(docJson) {
  if (!isRecord(docJson) || !isRecord(docJson.nodes)) return [];

  return Object.values(docJson.nodes).flatMap((moduleNode) => {
    if (!isRecord(moduleNode) || !Array.isArray(moduleNode.symbols)) return [];
    return moduleNode.symbols.filter(isRecord).flatMap(normalizeSymbol);
  });
}

function normalizeSymbol(symbol) {
  if (!Array.isArray(symbol.declarations)) return [];
  const declaration = symbol.declarations.find(
    (candidate) => isRecord(candidate) && candidate.declarationKind === "export",
  );
  if (!isRecord(declaration)) return [];
  return [
    {
      name: symbol.name,
      jsDoc: declaration.jsDoc,
      functionDef: declaration.def,
    },
  ];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
