import { IRExpression } from "@/cli/types/ir.types.js";
import { BinaryExpression, CallExpression, Expression, Identifier, NumericLiteral, PropertyAccessExpression, StringLiteral, SyntaxKind } from "ts-morph";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { LiteralIRBuilder } from "../literal/ir-builder.js";
import { CallFunctionIRBuilder } from "../call-function/ir-builder.js";
import { BinaryExpressionIRBuilder } from "../binary-expression/ir-builder.js";
import { MemberIRBuilder } from "../member/ir-builder.js";

/**
 * Builds the IR for an expression
 * Example: "hello", 42, true, false, increment(), U256Factory.create(), contract.balance, u256value.toString()
 */
export class ExpressionIRBuilder extends IRBuilder<IRExpression> {
  private expression: Expression;

  constructor(expression: Expression, errorManager: ErrorManager) {
    super(errorManager);
    this.expression = expression;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRExpression {
    switch (this.expression.getKind()) {
      /* ---------- Literal values ---------- */
      // Example: "hello", 42, true, false
      case SyntaxKind.StringLiteral:
      case SyntaxKind.NumericLiteral:
      case SyntaxKind.TrueKeyword:
      case SyntaxKind.FalseKeyword: {
        const literal = new LiteralIRBuilder(this.expression, this.errorManager)
        return literal.validateAndBuildIR()
      }

  
      /* ---------- Variables ---------- */
      // Example: counter, value, amount
      case SyntaxKind.Identifier: {
        const id = this.expression as Identifier;
        return { kind: "var", name: id.getText() };
      }
  
      /* ---------- Function calls ---------- */
      // Example: increment(), U256Factory.create()
      case SyntaxKind.CallExpression: {
        const call = new CallFunctionIRBuilder(this.expression as CallExpression, this.errorManager)
        return call.validateAndBuildIR()
      }
  
      /* ---------- Member access ---------- */
      // For method access obj.prop, this is a PropertyAccessExpression
      // For property access obj["prop"], this is an ElementAccessExpression
      case SyntaxKind.PropertyAccessExpression: {
        // Example: contract.balance, u256value.toString()
        const member = new MemberIRBuilder(this.expression as PropertyAccessExpression, this.errorManager)
        return member.validateAndBuildIR()
      }
  
      case SyntaxKind.BinaryExpression: {
        const bin = new BinaryExpressionIRBuilder(this.expression as BinaryExpression, this.errorManager)
        return bin.validateAndBuildIR()
      }
  
      default:
        throw new Error(`IRExpr: unsupported node kind ${this.expression.getKindName()}`);
    }
  }
}