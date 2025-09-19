import { PrefixUnaryExpression, SyntaxKind } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, IRUnaryExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";

export class UnaryExpressionIRBuilder extends IRBuilder<IRExpression> {
  private expression: PrefixUnaryExpression;

  constructor(expression: PrefixUnaryExpression) {
    super(expression);
    this.expression = expression;
  }

  validate(): boolean {
    return true;
  }

  private getUnaryOp(): string {
    // Get the operator from the prefix unary expression
    const operatorKind = this.expression.getOperatorToken();

    if (operatorKind === SyntaxKind.ExclamationToken) {
      return "!";
    } else if (operatorKind === SyntaxKind.MinusToken) {
      return "-";
    } else {
      throw new Error(`Unsupported unary operator: ${operatorKind}`);
    }
  }

  private getUnaryType(op: string): SupportedType {
    if (op === "!") {
      return AbiType.Bool;
    }

    if (op === "-") {
      return AbiType.Int256;
    }

    throw new Error(`Unsupported unary operator: ${op}`);
  }

  buildIR(): IRUnaryExpression {
    // Get the operand expression and build it recursively
    const operandExpression = this.expression.getOperand();
    const expressionBuilder = new ExpressionIRBuilder(operandExpression);
    const expr = expressionBuilder.validateAndBuildIR();

    const op = this.getUnaryOp();
    const type = this.getUnaryType(op);

    return {
      kind: "unary",
      op,
      expr,
      type,
      returnType: AbiType.Bool,
    };
  }
}
