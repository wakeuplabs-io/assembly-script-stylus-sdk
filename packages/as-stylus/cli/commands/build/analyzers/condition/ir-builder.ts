import { BinaryExpression, Expression, SyntaxKind } from "ts-morph";

import { IRCondition, IRExpressionBinary } from "@/cli/types/ir.types.js";

import {  ConditionSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { LiteralIRBuilder } from "../literal/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ConditionExpressionIRBuilder extends IRBuilder<IRExpressionBinary | IRCondition> {
  private expression: Expression;

  constructor(expression: Expression, errorManager: ErrorManager) {
    super(errorManager);
    this.expression = expression;
  }

  validate(): boolean {
    const syntaxValidator = new ConditionSyntaxValidator(this.expression, this.errorManager);
    return syntaxValidator.validate();
  }

  buildIR(): IRExpressionBinary | IRCondition {
    const isBinary = this.expression.getKind() === SyntaxKind.BinaryExpression;
    if (isBinary) {
      const binaryExpression = this.expression.asKindOrThrow(SyntaxKind.BinaryExpression) as BinaryExpression;
      return {
        kind: "condition",
        op: binaryExpression.getOperatorToken().getText(),
        left: new ExpressionIRBuilder(binaryExpression.getLeft() as Expression, this.errorManager).validateAndBuildIR(),
        right: new ExpressionIRBuilder(binaryExpression.getRight() as Expression, this.errorManager).validateAndBuildIR(),
      } as IRCondition;
    }

    const isLiteral = this.expression.getKind() === SyntaxKind.TrueKeyword || this.expression.getKind() === SyntaxKind.FalseKeyword;
    if (isLiteral) {
      return { kind: "condition", left: new LiteralIRBuilder(this.expression, this.errorManager).validateAndBuildIR() } as IRCondition;
    }

    return { kind: "condition", left: new ExpressionIRBuilder(this.expression, this.errorManager).validateAndBuildIR() } as IRCondition;
  }
}