import { Expression, VariableDeclaration } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { VariableSyntaxValidator } from "./syntax-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";

/**
 * Builds the IR for a variable declaration statement
 * Example: "let counter = 0;"
 */
// TODO: rename to AssignmentIRBuilder
export class VariableIRBuilder extends IRBuilder<IRStatement> {
  private declaration: VariableDeclaration;

  constructor(declaration: VariableDeclaration, errorManager: ErrorManager) {
    super(errorManager);
    this.declaration = declaration;
  }

  validate(): boolean {
    const syntaxValidator = new VariableSyntaxValidator(this.declaration, this.errorManager);
    return syntaxValidator.validate();
  }

  buildIR(): IRStatement {
    const initializer = this.declaration.getInitializer();
    if (!initializer) {
      return {
        kind: "let",
        name: this.declaration.getName(),
        expr: { kind: "literal", value: null },
      };
    }

    const expression = new ExpressionIRBuilder(initializer as Expression, this.errorManager);
    return {
      kind: "let",
      name: this.declaration.getName(),
      expr: expression.validateAndBuildIR(),
    };
  }
}
