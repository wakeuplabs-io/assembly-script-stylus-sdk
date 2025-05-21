import { ReturnStatement } from "ts-morph";
import { IRBuilder } from "../shared/ir-builder";
import { ErrorManager } from "../shared/error-manager";
import { IRStatement } from "@/cli/types/ir.types";
import { toIRExpr } from "../helpers";
import { ReturnSyntaxValidator } from "./syntax-validator";

export class ReturnIRBuilder extends IRBuilder<IRStatement> {
  private statement: ReturnStatement;

  constructor(statement: ReturnStatement, errorManager: ErrorManager) {
    super(errorManager);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new ReturnSyntaxValidator(this.statement, this.errorManager);
    return syntaxValidator.validate();
  }

  build(): IRStatement {
    return {
      kind: "return",
      expr: toIRExpr(this.statement.getExpressionOrThrow())
    };
  }
} 