import { Expression, VariableDeclaration } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";
import { VariableSymbol } from "@/cli/types/symbol-table.types.js";
import { inferType } from "@/cli/utils/inferType.js";

import { VariableDeclarationSyntaxValidator } from "./syntax-validator.js";
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
    const variable: VariableSymbol = { name: this.declaration.getName(), type, scope: "memory" };

    // TODO: revise this case
    if (!initializer) {
      this.symbolTable.declareVariable(variable.name, variable);

      return {
        kind: "let",
        name: variable.name,
        type: variable.type,
        expr: { kind: "literal", value: null, type: variable.type },
        scope: variable.scope,
      };
    }

    const expression = new ExpressionIRBuilder(initializer as Expression).validateAndBuildIR();
    variable.type = (expression as any).returnType;
    this.symbolTable.declareVariable(variable.name, variable);

    return {
      kind: "let",
      name: variable.name,
      type: variable.type,
      expr: expression,
      scope: variable.scope,
    };
  }
}
