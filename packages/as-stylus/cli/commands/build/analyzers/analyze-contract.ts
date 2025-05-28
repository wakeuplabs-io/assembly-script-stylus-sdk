import { Block, SourceFile } from "ts-morph";
import { AbiStateMutability, AbiVisibility,STATE_MUTABILITY_DECORATORS, VISIBILITY_DECORATORS } from "../../../types/abi.types.js";
import { IRConstructor, IRContract, IRMethod, IRStatement, IRVariable } from "../../../types/ir.types.js";
import { toIRStmt } from "./helpers.js";

export function analyzeContract(sourceFile: SourceFile): IRContract {
  const classDecl = sourceFile.getClasses().find(cls =>
    cls.getDecorators().some(dec => dec.getName().toLowerCase() === "contract")
  );
  
  if (!classDecl) {
    throw new Error(`[semantic] No class decorated with @Contract was found.`);
  }

  const methods: IRMethod[] = [];
  let constructor: IRConstructor | undefined;

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
    const body = constructorData.getBodyOrThrow() as Block;
    const irBody = body.getStatements().map(toIRStmt);
    constructor = {
      inputs,
      ir: irBody
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

    const visibility: AbiVisibility = visDecorators[0]?.getName()?.toLowerCase() ?? "public";
    const stateMutability: AbiStateMutability = stateDecorators[0]?.getName()?.toLowerCase() ?? "nonpayable";

    const inputs = method.getParameters().map((param) => {
      return {
        name: param.getName(),
        type: param.getType().getText(),
      };
    });

    const returnType = method.getReturnType().getText();



    const body = method.getBodyOrThrow() as Block;

    const irBody = body.getStatements().map(toIRStmt);

    methods.push({
      name,
      visibility,
      inputs,
      outputs: returnType === "void" ? [] : [{ type: returnType }],
      stateMutability,
      ir: irBody 
    });
  }

  const variables: IRVariable[] = classDecl.getStaticProperties()
  .filter(prop => prop.getKindName() === "PropertyDeclaration")
  .map((prop, index) => {
    const name = prop.getName();
    const type = prop.getType().getText();
    return { name, type, slot: index };
  });



  return {
    name: classDecl.getName() ?? "Main",
    methods,
    constructor,
    storage: variables
  };
}



