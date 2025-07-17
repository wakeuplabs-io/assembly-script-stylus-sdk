import { ReturnStatement } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, IRStatement } from "@/cli/types/ir.types.js";

import { ReturnSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";

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

  private getType(expr: IRExpression): SupportedType {
    if (expr.kind === "call") {
      return expr.returnType;
    }

    return expr.type;
  }

  buildIR(): IRStatement {
    const expression = this.statement.getExpression();
    if (expression) {
      const expr = new ExpressionIRBuilder(expression).validateAndBuildIR();
      return {
        kind: "return",
        type: this.getType(expr),
        expr,
      };
    }

    return { kind: "return", type: AbiType.Void };
  }
}
