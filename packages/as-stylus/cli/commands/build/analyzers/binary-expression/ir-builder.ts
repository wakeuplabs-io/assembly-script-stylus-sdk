import { BinaryExpression, Expression } from "ts-morph";

import { Logger } from "@/cli/services/logger.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRCondition, IRExpression, IRExpressionBinary } from "@/cli/types/ir.types.js";

import { BinaryExpressionSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";

export class BinaryExpressionIRBuilder extends IRBuilder<IRExpressionBinary | IRCondition> {
  private expression: BinaryExpression;
  private op: string;
  private left: Expression;
  private right: Expression;
  private isConditional: boolean;

  constructor(expression: BinaryExpression, isConditional: boolean = false) {
    super(expression);
    this.expression = expression;
    this.op = expression.getOperatorToken().getText();
    this.left = expression.getLeft() as Expression;
    this.right = expression.getRight() as Expression;
    this.isConditional = isConditional;
  }

  validate(): boolean {
    const syntaxValidator = new BinaryExpressionSyntaxValidator(this.expression, this.isConditional);
    return syntaxValidator.validate();
  }

  private getConversionType(left: IRExpression, right: IRExpression): SupportedType {
    const leftType = left.type;
    let rightType = right.type;

    if (rightType === AbiType.Function) {
      rightType = (right as any).returnType;
    }

    if (leftType === AbiType.Unknown) {
      return rightType;
    }

    if (leftType !== rightType) {
      Logger.getInstance().warn(`TODO: implement conversion from ${rightType} to ${leftType}`);
      return leftType;  
    }

    return leftType;
  }

  buildIR(): IRExpressionBinary | IRCondition {
    const left = new ExpressionIRBuilder(this.left).validateAndBuildIR();
    const right = new ExpressionIRBuilder(this.right).validateAndBuildIR();
    const type = this.getConversionType(left, right);
    
    if (this.isConditional) {
      return {
        kind: "condition",
        op: this.op,
        left,
        right,
        type,
      } as IRCondition;
    }

    if (this.op === "&&" || this.op === "||") {
      return {
        kind: "binary",
        op: this.op,
        left,
        right,
        type: AbiType.Bool,
      };
    }

    return {
      kind: "binary",
      op: this.op,
      left,
      right,
      type,
    };
  }
}