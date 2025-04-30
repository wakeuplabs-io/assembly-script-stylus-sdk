import { Project, SyntaxKind, SourceFile, NewExpression } from "ts-morph";
export function transformNewU256(sourceFile: SourceFile): void {

  const newExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression);
  newExpressions.forEach((newExpr: NewExpression, index: number) => {

    const className = newExpr.getExpression().getText();
    if (className !== "U256") return;

    const args = newExpr.getArguments();
    if (args.length !== 1) return;

    const literalArg = args[0];
    if (literalArg.getKindName() !== "StringLiteral") return;

    const value = literalArg.getText().slice(1, -1); // remove quotes

    const mallocVar = `__str${index}`;
    const u256Var = `__u256${index}`;

    // Generar la memoria del string (malloc + stores)
    const stores = [];
    stores.push(`const ${mallocVar} = malloc(${value.length});`);
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      stores.push(`store<u8>(${mallocVar} + ${i}, ${charCode});`);
    }

    // Crear el U256
    const creation = `const ${u256Var} = U256.create();`;
    const setFromString = `U256.setFromString(${u256Var}, ${mallocVar}, ${value.length});`;

    const replacement = `(() => {
      ${stores.join("\n")}
      ${creation}
      ${setFromString}
      return ${u256Var};
    })()`;

    newExpr.replaceWithText(replacement);
  });

  // if (!alreadyHasImport(sourceFile, "U256")) {
  //   sourceFile.insertImportDeclaration(0, {
  //     moduleSpecifier: "../../../core/types/u2das6",
  //     namedImports: ["U256"],
  //   });
  // }
  
  sourceFile.saveSync();
}


function alreadyHasImport(sourceFile: SourceFile, symbolName: string): boolean {
  const imports = sourceFile.getImportDeclarations();
  return imports.some((imp) => {
    const namedImports = imp.getNamedImports();
    return namedImports.some((n) => n.getName() === symbolName);
  });
}
