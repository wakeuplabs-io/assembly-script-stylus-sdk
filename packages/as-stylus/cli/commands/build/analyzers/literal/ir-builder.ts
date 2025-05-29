import { Expression, SyntaxKind, StringLiteral, NumericLiteral } from "ts-morph";

import { IRExpression } from "@/cli/types/ir.types.js";

import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";

/**
 * Builds the IR for a literal expression
 * Example: "0", "hello", true, false, null
 */
export class LiteralIRBuilder extends IRBuilder<IRExpression> {
  private expression: Expression;

  constructor(expression: Expression, errorManager: ErrorManager) {
    super(errorManager);
    this.expression = expression;
  }

  validate(): boolean {
    const kind = this.expression.getKind();
    return (
      kind === SyntaxKind.StringLiteral ||
      kind === SyntaxKind.NumericLiteral ||
      kind === SyntaxKind.TrueKeyword ||
      kind === SyntaxKind.FalseKeyword
    );
  }

  buildIR(): IRExpression {
    switch (this.expression.getKind()) {
      case SyntaxKind.StringLiteral: {
        const lit = this.expression as StringLiteral;
        return { kind: "literal", value: lit.getLiteralText() };
      }
      case SyntaxKind.NumericLiteral: {
        const lit = this.expression as NumericLiteral;
        return { kind: "literal", value: Number(lit.getLiteralText()) };
      }
      case SyntaxKind.TrueKeyword:
        return { kind: "literal", value: true };
      case SyntaxKind.FalseKeyword:
        return { kind: "literal", value: false };
      default:
        throw new Error(`LiteralIRBuilder: unsupported literal kind ${this.expression.getKindName()}`);
    }
  }
} 