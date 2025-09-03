import {
  AsExpression,
  BinaryExpression,
  CallExpression,
  ConditionalExpression,
  Expression,
  Identifier,
  ParenthesizedExpression,
  PrefixUnaryExpression,
  PropertyAccessExpression,
  SyntaxKind,
} from "ts-morph";

import { Logger } from "@/cli/services/logger.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { buildVariableIR } from "./variable.js";
import { BinaryExpressionIRBuilder } from "../binary-expression/ir-builder.js";
import { CallFunctionIRBuilder } from "../call-function/ir-builder.js";
import { ChainedCallAnalyzer } from "../chained-call/ir-builder.js";
import { LiteralIRBuilder } from "../literal/ir-builder.js";
import { MemberIRBuilder } from "../member/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { UnaryExpressionIRBuilder } from "../unary-expression/ir-builder.js";

/**
 * Builds the IR for an expression
 * Example: "hello", 42, true, false, increment(), U256Factory.create(), contract.balance, u256value.toString()
 */
export class ExpressionIRBuilder extends IRBuilder<IRExpression> {
  private expression: Expression;

  constructor(expression: Expression) {
    super(expression);
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
        const literal = new LiteralIRBuilder(this.expression);
        return literal.validateAndBuildIR();
      }

      /* ---------- Variables ---------- */
      // Example: counter, value, amount
      case SyntaxKind.ThisKeyword: {
        return { kind: "this", type: AbiType.Void };
      }
      case SyntaxKind.Identifier: {
        return buildVariableIR(this.expression as Identifier, this.symbolTable);
      }

      /* ---------- Function calls ---------- */
      case SyntaxKind.CallExpression: {
        const callExpr = this.expression as CallExpression;

        // Check if this is a chained call first
        if (ChainedCallAnalyzer.isChainedCall(callExpr)) {
          const chainedAnalyzer = new ChainedCallAnalyzer(callExpr);
          return chainedAnalyzer.validateAndBuildIR();
        }

        // Regular call processing
        const call = new CallFunctionIRBuilder(callExpr);
        return call.validateAndBuildIR();
      }

      /* ---------- Member access ---------- */
      // For method access obj.prop, this is a PropertyAccessExpression
      // For property access obj["prop"], this is an ElementAccessExpression
      case SyntaxKind.PropertyAccessExpression: {
        const count = this.expression.getText().split(".").length;
        if (this.expression.getText().startsWith("this.") && count === 2) {
          return buildVariableIR(this.expression as Identifier, this.symbolTable);
        }

        // Example: contract.balance, u256value.toString()
        const member = new MemberIRBuilder(this.expression as PropertyAccessExpression);
        return member.validateAndBuildIR();
      }

      case SyntaxKind.BinaryExpression: {
        const bin = new BinaryExpressionIRBuilder(this.expression as BinaryExpression);
        return bin.validateAndBuildIR();
      }

      case SyntaxKind.PrefixUnaryExpression: {
        const unary = new UnaryExpressionIRBuilder(this.expression as PrefixUnaryExpression);
        return unary.buildIR();
      }

      /* ---------- Conditional (ternary) expression ---------- */
      // Example: condition ? trueValue : falseValue
      case SyntaxKind.ConditionalExpression: {
        const conditional = this.expression as ConditionalExpression;
        const condition = new ExpressionIRBuilder(conditional.getCondition()).validateAndBuildIR();
        const whenTrue = new ExpressionIRBuilder(conditional.getWhenTrue()).validateAndBuildIR();
        const whenFalse = new ExpressionIRBuilder(conditional.getWhenFalse()).validateAndBuildIR();

        // For now, return a simple representation (TODO: implement proper conditional IR)
        return {
          kind: "call",
          target: "conditional",
          args: [condition, whenTrue, whenFalse],
          type: AbiType.Function,
          returnType: AbiType.Bool,
          scope: "memory",
        };
      }

      /* ---------- Parenthesized expressions ---------- */
      // Example: (expression), (address as IERC20)
      case SyntaxKind.ParenthesizedExpression: {
        const parenExpr = this.expression as ParenthesizedExpression;
        const innerExpr = parenExpr.getExpression();

        // Check if this is interface casting: (address as Interface)
        if (innerExpr.getKind() === SyntaxKind.AsExpression) {
          const asExpr = innerExpr as AsExpression;
          const targetType = asExpr.getType().getText();

          // For now, create a placeholder - will be processed by InterfaceCastIRBuilder
          return {
            kind: "interface_cast",
            expression: new ExpressionIRBuilder(asExpr.getExpression()).validateAndBuildIR(),
            interfaceName: targetType,
            type: AbiType.Address, // Interface cast results in an address-like object
          };
        }

        // Regular parenthesized expression - just unwrap
        return new ExpressionIRBuilder(innerExpr).validateAndBuildIR();
      }

      default: {
        Logger.getInstance().warn(`IRExpr: unsupported node kind ${this.expression.getKindName()}`);
        throw new Error(`IRExpr: unsupported node kind ${this.expression.getKindName()}`);
      }
    }
  }
}
