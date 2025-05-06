import { SourceFile } from "ts-morph";
import { AnalyzedConstructor, AnalyzedContract, AnalyzedMethod, STATE_MUTABILITY_DECORATORS, StateMutability, Visibility, VISIBILITY_DECORATORS } from "../../../types/types.js";

export function analyzeContract(sourceFile: SourceFile): AnalyzedContract {
  const classDecl = sourceFile.getClassOrThrow("Main");
  const methods: AnalyzedMethod[] = [];
  let constructor: AnalyzedConstructor | undefined;

  const constructors = classDecl.getConstructors();
  if (constructors.length > 1) {
    throw new Error(`[semantic] Contract class "Main" has more than one constructor.`);
  }
  if (constructors.length === 1) {
    const constructorData = constructors[0];
    const inputs = constructorData.getParameters().map((param) => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));
    constructor = {
      constructor: constructorData,
      inputs,
    };
  }

  for (const method of classDecl.getStaticMethods()) {
    const name = method.getName();
    const decorators = method.getDecorators();

    const visDecorators = decorators.filter(d => VISIBILITY_DECORATORS.includes(d.getName()));
    if (visDecorators.length > 1) {
      throw new Error(`[semantic] Method "${name}" has multiple visibility decorators: ${visDecorators.map(d => d.getName()).join(", ")}`);
    }

    const stateDecorators = decorators.filter(d => STATE_MUTABILITY_DECORATORS.includes(d.getName()));
    if (stateDecorators.length > 1) {
      throw new Error(`[semantic] Method "${name}" has multiple mutability decorators: ${stateDecorators.map(d => d.getName()).join(", ")}`);
    }

    const visibility: Visibility = visDecorators[0]?.getName() as Visibility ?? "public";

    const stateMutability = stateDecorators[0]?.getName() as StateMutability ?? "nonpayable";

    const inputs = method.getParameters().map((param) => {
      return {
        name: param.getName(),
        type: param.getType().getText(),
      };
    });

    const returnType = method.getReturnType().getText();
    console.log({ returnType })
    methods.push({
      name,
      visibility,
      inputs,
      outputs: returnType === "void" ? [] : [{ type: returnType }],
      stateMutability,
      method,
    });
  }

  return {
    name: classDecl.getName() ?? "Main",
    methods,
    constructor,
  };
}
