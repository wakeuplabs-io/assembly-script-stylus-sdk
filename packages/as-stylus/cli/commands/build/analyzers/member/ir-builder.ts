import { PropertyAccessExpression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
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
    const object = new ExpressionIRBuilder(this.expression.getExpression()).validateAndBuildIR();
    const variable = this.symbolTable.lookup(this.expression.getName());
    return {
      kind: "member",
      object: object,
      property: this.expression.getName(),
      type: variable?.type || AbiType.Void,
    };
  }
} 