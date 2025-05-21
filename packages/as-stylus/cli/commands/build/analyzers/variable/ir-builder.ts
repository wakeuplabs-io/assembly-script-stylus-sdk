import { VariableDeclaration } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { toIRExpr } from "../helpers.js";
import { VariableSyntaxValidator } from "./syntax-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

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

  build(): IRStatement {
    return {
      kind: "let",
      name: this.declaration.getName(),
      expr: toIRExpr(this.declaration.getInitializerOrThrow()),
    };
  }
}
