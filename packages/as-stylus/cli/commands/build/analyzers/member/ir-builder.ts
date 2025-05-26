import { PropertyAccessExpression } from "ts-morph";
import { IRBuilder } from "../shared/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";

/**
 * Builds the IR for a member access expression
 * Example: contract.balance, u256value.toString()
 */
export class MemberIRBuilder extends IRBuilder<IRExpression> {
  private expression: PropertyAccessExpression;

  constructor(expression: PropertyAccessExpression, errorManager: ErrorManager) {
    super(errorManager);
    this.expression = expression;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRExpression {
    const object = new ExpressionIRBuilder(this.expression.getExpression(), this.errorManager)

    return {
      kind: "member",
      object: object.validateAndBuildIR(),
      property: this.expression.getName(),
    };
  }
} 