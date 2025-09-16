import { BinaryExpression, Expression, SyntaxKind } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import {
  ComparisonOperator,
  IRCondition,
  IRExpression,
  IRExpressionBinary,
} from "@/cli/types/ir.types.js";

import { ConditionSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { LiteralIRBuilder } from "../literal/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ConditionExpressionIRBuilder extends IRBuilder<IRExpressionBinary | IRCondition> {
  private expression: Expression;

  constructor(expression: Expression) {
    super(expression);
    this.expression = expression;
  }

  validate(): boolean {
    const syntaxValidator = new ConditionSyntaxValidator(this.expression);
    return syntaxValidator.validate();
  }

  buildIR(): IRCondition {
    const isBinary = this.expression.getKind() === SyntaxKind.BinaryExpression;
    if (isBinary) {
      const binaryExpression = this.expression.asKindOrThrow(
        SyntaxKind.BinaryExpression,
      ) as BinaryExpression;
      const left = new ExpressionIRBuilder(
        binaryExpression.getLeft() as Expression,
      ).validateAndBuildIR() as IRExpression;
      const right = new ExpressionIRBuilder(
        binaryExpression.getRight() as Expression,
      ).validateAndBuildIR() as IRExpression;

      return {
        kind: "condition",
        type: AbiType.Bool,
        op: binaryExpression.getOperatorToken().getText() as ComparisonOperator,
        left,
        right,
      } satisfies IRCondition;
    }

    const isLiteral =
      this.expression.getKind() === SyntaxKind.TrueKeyword ||
      this.expression.getKind() === SyntaxKind.FalseKeyword;
    if (isLiteral) {
      return {
        kind: "condition",
        left: new LiteralIRBuilder(this.expression).validateAndBuildIR(),
        type: AbiType.Bool,
      } satisfies IRCondition;
    }

    return {
      kind: "condition",
      left: new ExpressionIRBuilder(this.expression).validateAndBuildIR(),
      type: AbiType.Bool,
    } satisfies IRCondition;
  }
}
