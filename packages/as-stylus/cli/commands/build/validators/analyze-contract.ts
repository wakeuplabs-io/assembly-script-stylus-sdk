import { Project, SourceFile } from "ts-morph";

const VISIBILITY_DECORATORS = ["public", "private", "internal", "external"];
type Visibility = typeof VISIBILITY_DECORATORS[number];

export type AnalyzedMethod = {
  name: string;
  visibility: Visibility;
  exported: boolean;
  method: import("ts-morph").MethodDeclaration;
};

export function analyzeContract(sourceFile: SourceFile): AnalyzedMethod[] {
  const classDecl = sourceFile.getClassOrThrow("Main");

  const result: AnalyzedMethod[] = [];

  for (const method of classDecl.getStaticMethods()) {
    const name = method.getName();
    const decorators = method.getDecorators();

    const visDecorators = decorators.filter(d => VISIBILITY_DECORATORS.includes(d.getName()));
    if (visDecorators.length > 1) {
      throw new Error(`[semantic] Method "${name}" has multiple visibility decorators: ${visDecorators.map(d => d.getName()).join(", ")}`);
    }

    const visibility: Visibility = visDecorators[0]?.getName() as Visibility ?? "public";

    const exported = method.hasModifier("export");

    if (visibility === "private" && exported) {
      throw new Error(`[semantic] Method "${name}" is marked @private but is exported.`);
    }

    if (visibility === "external" && !exported) {
      throw new Error(`[semantic] Method "${name}" is marked @external but is not exported.`);
    }

    result.push({ name, visibility, exported, method });
  }

  return result;
}
