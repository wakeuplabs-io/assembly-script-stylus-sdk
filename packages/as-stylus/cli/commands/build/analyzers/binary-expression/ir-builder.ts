import { BinaryExpression, Expression } from "ts-morph";

import { IRCondition, IRExpressionBinary } from "@/cli/types/ir.types.js";

import { BinaryExpressionSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class BinaryExpressionIRBuilder extends IRBuilder<IRExpressionBinary | IRCondition> {
  private expression: BinaryExpression;
  private op: string;
  private left: Expression;
  private right: Expression;
  private isConditional: boolean;

  constructor(expression: BinaryExpression, errorManager: ErrorManager, isConditional: boolean = false) {
    super(errorManager);
    this.expression = expression;
    this.op = expression.getOperatorToken().getText();
    this.left = expression.getLeft() as Expression;
    this.right = expression.getRight() as Expression;
    this.isConditional = isConditional;
  }

  validate(): boolean {
    const syntaxValidator = new BinaryExpressionSyntaxValidator(this.expression, this.errorManager, this.isConditional);
    return syntaxValidator.validate();
  }

  buildIR(): IRExpressionBinary | IRCondition {
    if (this.isConditional) {
      return {
        kind: "condition",
        op: this.op,
        left: new ExpressionIRBuilder(this.left, this.errorManager).validateAndBuildIR(),
        right: new ExpressionIRBuilder(this.right, this.errorManager).validateAndBuildIR(),
      } as IRCondition;
    }

    return {
      kind: "binary",
      op: this.op,
      left: new ExpressionIRBuilder(this.left, this.errorManager).validateAndBuildIR(),
      right: new ExpressionIRBuilder(this.right, this.errorManager).validateAndBuildIR(),
    };
  }
}