import { Expression, VariableDeclaration } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRStatement } from "@/cli/types/ir.types.js";
import { VariableSymbol } from "@/cli/types/symbol-table.types.js";
import { inferType } from "@/cli/utils/inferType.js";

import { VariableDeclarationSyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

/**
 * Builds the IR for a variable declaration statement
 * Example: "let counter = 0;"
 */
export class VariableDeclarationIRBuilder extends IRBuilder<IRStatement> {
  private declaration: VariableDeclaration;

  constructor(declaration: VariableDeclaration) {
    super(declaration);
    this.declaration = declaration;
  }

  validate(): boolean {
    const syntaxValidator = new VariableDeclarationSyntaxValidator(this.declaration);
    return syntaxValidator.validate();
  }

  buildIR(): IRStatement {
    const initializer = this.declaration.getInitializer();
    const type = inferType(initializer?.getText() ?? "");
    
    const variableStatement = this.declaration.getVariableStatement();
    let declarationKind = "let";
    
    if (variableStatement) {
      const declarationList = variableStatement.getDeclarationList();
      const keywordNodes = declarationList.getDeclarationKindKeywords();
      if (keywordNodes.length > 0) {
        declarationKind = keywordNodes[0].getText();
      }
    }
    
    const kind = declarationKind === "const" ? "const" : "let" as "let" | "const";
    
    const variable: VariableSymbol = { name: this.declaration.getName(), type: convertType(type), scope: "memory" };
    if (!initializer) {
      this.symbolTable.declareVariable(variable.name, variable);

      return {
        kind,
        name: variable.name,
        type: variable.type,
        expr: { kind: "literal", value: null, type: variable.type },
        scope: variable.scope,
      };
    }

    const expression = new ExpressionIRBuilder(initializer as Expression).validateAndBuildIR();
    if (type === AbiType.Any || type === AbiType.Unknown) {
      variable.type = (expression as any).returnType ?? (expression as any).type ?? variable.type;
    }
    this.symbolTable.declareVariable(variable.name, variable);

    return {
      kind,
      name: variable.name,
      type: variable.type,
      expr: expression,
      scope: variable.scope,
    };
  }
}
