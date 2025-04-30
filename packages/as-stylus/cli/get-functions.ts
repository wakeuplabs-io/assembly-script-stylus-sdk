import { Project, SyntaxKind } from "ts-morph";

/**
 * @param {string} userFilePath - Full path to user's index.ts
 */
export function generateUserEntrypoint(userFilePath: string) {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(userFilePath);

  const classes = sourceFile.getClasses();
  let className = "";
  const staticCalls = [];

  for (const cls of classes) {
    className = cls.getName() as string;
    const methods = cls.getStaticMethods();
    
    for (const method of methods) {
      const name = method.getName();
      console.log("methods", methods);
      if (!method.hasModifier(SyntaxKind.PrivateKeyword)) {
        staticCalls.push(`${className}.${name}();`);
      }
    }
  }

  if (!className || staticCalls.length === 0) {
    throw new Error("No static class with methods found.");
  }

  const imports = `import { ${className} } from "./type-definition";`;

  const entrypointBody = `
export function entrypoint(): void {
  ${staticCalls.join("\n  ")}
}
`;

  return { imports, entrypointBody };
}
