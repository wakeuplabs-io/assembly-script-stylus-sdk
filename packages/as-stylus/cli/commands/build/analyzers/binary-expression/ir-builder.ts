import { IRBuilder } from "../shared/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { BinaryExpression, Expression, SyntaxKind } from "ts-morph";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";

export class BinaryExpressionIRBuilder extends IRBuilder<IRExpression> {
  private expression: BinaryExpression;

  constructor(expression: BinaryExpression, errorManager: ErrorManager) {
    super(errorManager);
    this.expression = expression;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRExpression {
    const bin = this.expression.asKindOrThrow(SyntaxKind.BinaryExpression);
    const op = bin.getOperatorToken().getText(); // Gets the operator token ("+", "-", "*", "/", "=", etc.)

    const left = new ExpressionIRBuilder(bin.getLeft() as Expression, this.errorManager)
    const right = new ExpressionIRBuilder(bin.getRight() as Expression, this.errorManager)

    return {
      kind: "binary",
      op,
      left: left.validateAndBuildIR(),
      right: right.validateAndBuildIR(),
    };
  }
}