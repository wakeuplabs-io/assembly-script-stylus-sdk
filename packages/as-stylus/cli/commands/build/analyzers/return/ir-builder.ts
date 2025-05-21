import { ReturnStatement } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { toIRExpr } from "../helpers.js";
import { ReturnSyntaxValidator } from "./syntax-validator.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

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
      expr: toIRExpr(this.statement.getExpressionOrThrow()),
    };
  }
}
