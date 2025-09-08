import {
  BinaryExpression,
  CallExpression,
  ConditionalExpression,
  Expression,
  Identifier,
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

      /* ---------- Array access ---------- */
      // Example: array[index]
      case SyntaxKind.ElementAccessExpression: {
        const elementAccess = this.expression as any;

        const arrayExpr = elementAccess.getExpression();
        const indexExpr = elementAccess.getArgumentExpression();

        const arrayIR = new ExpressionIRBuilder(arrayExpr).validateAndBuildIR();
        const indexIR = new ExpressionIRBuilder(indexExpr).validateAndBuildIR();

        let resultType = AbiType.Unknown;

        if (arrayIR.kind === "var" && arrayIR.scope === "storage") {
          const arrayVar = this.symbolTable.lookup(arrayIR.name);

          if (arrayVar?.dynamicType?.includes("[")) {
            const elementTypeMatch = arrayVar.dynamicType.match(/^([^[]+)/);
            if (elementTypeMatch) {
              const elementTypeName = elementTypeMatch[1];

              switch (elementTypeName) {
                case "U256":
                  resultType = AbiType.Uint256;
                  break;
                case "I256":
                  resultType = AbiType.Int256;
                  break;
                case "Address":
                  resultType = AbiType.Address;
                  break;
                default:
                  resultType = AbiType.Unknown;
              }
            }
          }
        }

        // Handle memory arrays (calldata parameters, local variables)
        if (arrayIR.kind === "var" && arrayIR.scope === "memory") {
          const arrayVar = this.symbolTable.lookup(arrayIR.name);
          
          if (arrayVar?.type === AbiType.ArrayDynamic || arrayVar?.type === AbiType.ArrayStatic) {
            // For memory arrays, infer element type from the array type
            if (arrayVar.dynamicType?.includes("[")) {
              const elementTypeMatch = arrayVar.dynamicType.match(/^([^[]+)/);
              if (elementTypeMatch) {
                const elementTypeName = elementTypeMatch[1];

                switch (elementTypeName) {
                  case "U256":
                    resultType = AbiType.Uint256;
                    break;
                  case "I256":
                    resultType = AbiType.Int256;
                    break;
                  case "Address":
                    resultType = AbiType.Address;
                    break;
                  case "String":
                    resultType = AbiType.String;
                    break;
                  default:
                    resultType = AbiType.Unknown;
                }
              }
            } else {
              // Fallback: if no dynamicType, assume U256[] for array_dynamic
              if (arrayVar.type === AbiType.ArrayDynamic) {
                resultType = AbiType.Uint256; // Common case for calldata U256[]
              }
            }
          }
        }

        const arrayAccessIR: IRExpression = {
          kind: "array_access",
          array: arrayIR,
          index: indexIR,
          type: resultType,
        };

        return arrayAccessIR;
      }

      /* ---------- Array literals ---------- */
      // Example: [a, b, c] or []
      case SyntaxKind.ArrayLiteralExpression: {
        const arrayLiteral = this.expression as any; // ArrayLiteralExpression type

        const elements = arrayLiteral.getElements();

        const elementIRs: IRExpression[] = [];
        for (const element of elements) {
          const elementIR = new ExpressionIRBuilder(element).validateAndBuildIR();
          elementIRs.push(elementIR);
        }

        const arrayLiteralIR: IRExpression = {
          kind: "array_literal",
          elements: elementIRs,
          type: AbiType.Array,
        };

        return arrayLiteralIR;
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

        return {
          kind: "call",
          target: "conditional",
          args: [condition, whenTrue, whenFalse],
          type: AbiType.Function,
          returnType: AbiType.Bool,
          scope: "memory",
        };
      }

      default: {
        Logger.getInstance().warn(`IRExpr: unsupported node kind ${this.expression.getKindName()}`);
        throw new Error(`IRExpr: unsupported node kind ${this.expression.getKindName()}`);
      }
    }
  }
}
