import {
  Expression,
  SyntaxKind,
  StringLiteral,
  NumericLiteral,
  Identifier,
  CallExpression,
  PropertyAccessExpression,
} from "ts-morph";

import { IRExpression } from "@/cli/types/ir.types.js";

/**
 * Converts TypeScript expressions to Intermediate Representation (IR)
 *
 * @param expr - The TypeScript expression to convert
 * @returns The IR representation of the expression
 */

export function toIRExpr(expr: Expression): IRExpression {
  switch (expr.getKind()) {
    /* ---------- Literal values ---------- */
    // Example: "hello", 42, true, false
    case SyntaxKind.StringLiteral: {
      const lit = expr as StringLiteral;
      return { kind: "literal", value: lit.getLiteralText() };
    }
    case SyntaxKind.NumericLiteral: {
      const lit = expr as NumericLiteral;
      return { kind: "literal", value: Number(lit.getLiteralText()) };
    }
    case SyntaxKind.TrueKeyword:
      return { kind: "literal", value: true };
    case SyntaxKind.FalseKeyword:
      return { kind: "literal", value: false };

    /* ---------- Variables ---------- */
    // Example: counter, value, amount
    case SyntaxKind.Identifier: {
      const id = expr as Identifier;
      return { kind: "var", name: id.getText() };
    }

    /* ---------- Function calls ---------- */
    // Example: increment(), U256Factory.create()
    case SyntaxKind.CallExpression: {
      const call = expr as CallExpression;
      const target = call.getExpression().getText();
      const args = call.getArguments().map((a) => toIRExpr(a as Expression));
      return { kind: "call", target, args };
    }

    /* ---------- Member access ---------- */
    // For method access obj.prop, this is a PropertyAccessExpression
    // For property access obj["prop"], this is an ElementAccessExpression
    case SyntaxKind.PropertyAccessExpression: {
      // Example: contract.balance, u256value.toString()
      const pa = expr as PropertyAccessExpression;
      return {
        kind: "member",
        object: toIRExpr(pa.getExpression()),
        property: pa.getName(),
      };
    }

    case SyntaxKind.BinaryExpression: {
      const bin = expr.asKindOrThrow(SyntaxKind.BinaryExpression);
      const op = bin.getOperatorToken().getText(); // Gets the operator token ("+", "-", "*", "/", "=", etc.)
      return {
        kind: "binary",
        op,
        left: toIRExpr(bin.getLeft() as Expression),
        right: toIRExpr(bin.getRight() as Expression),
      };
    }

    default:
      throw new Error(`IRExpr: unsupported node kind ${expr.getKindName()}`);
  }
}
