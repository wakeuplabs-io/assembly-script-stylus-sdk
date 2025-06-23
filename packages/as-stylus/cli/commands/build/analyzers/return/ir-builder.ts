import { ReturnStatement } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { ReturnSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ReturnIRBuilder extends IRBuilder<IRStatement> {
  private statement: ReturnStatement;

  constructor(statement: ReturnStatement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new ReturnSyntaxValidator(this.statement);
    return syntaxValidator.validate();
  }

  buildIR(): IRStatement {
    const expression = this.statement.getExpression();

    if (expression) {
      const expr = new ExpressionIRBuilder(expression).validateAndBuildIR();
      return {
        kind: "return",
        expr,
      };
    }

    return { kind: "return", valueType: "void" };
  }
}
