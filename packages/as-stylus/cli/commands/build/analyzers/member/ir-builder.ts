import { PropertyAccessExpression } from "ts-morph";

import { IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

/**
 * Builds the IR for a member access expression
 * Example: contract.balance, u256value.toString()
 */
export class MemberIRBuilder extends IRBuilder<IRExpression> {
  private expression: PropertyAccessExpression;

  constructor(expression: PropertyAccessExpression) {
    super(expression);
    this.expression = expression;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRExpression {
    const object = new ExpressionIRBuilder(this.expression.getExpression());
    const objectBuilt = object.validateAndBuildIR();

    return {
      kind: "member",
      object: objectBuilt,
      property: this.expression.getName(),
      type: (objectBuilt as any).type,
    };
  }
} 