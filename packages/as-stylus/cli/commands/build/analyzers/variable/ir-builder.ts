import { VariableDeclaration } from "ts-morph";
import { IRBuilder } from "../shared/ir-builder";
import { ErrorManager } from "../shared/error-manager";
import { IRStatement } from "@/cli/types/ir.types";
import { toIRExpr } from "../helpers";
import { VariableSyntaxValidator } from "./syntax-validator";

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
      expr: toIRExpr(this.declaration.getInitializerOrThrow())
    };
  }
} 