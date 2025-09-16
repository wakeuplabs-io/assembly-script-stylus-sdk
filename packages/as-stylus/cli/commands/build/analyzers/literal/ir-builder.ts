import { Expression, SyntaxKind, StringLiteral, NumericLiteral } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { IRBuilder } from "../shared/ir-builder.js";

/**
 * Builds the IR for a literal expression
 * Example: "0", "hello", true, false, null
 */
export class LiteralIRBuilder extends IRBuilder<IRExpression> {
  private expression: Expression;

  constructor(expression: Expression) {
    super(expression);
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

  isAddress(value: string): boolean {
    return value.startsWith("0x") && value.length === 42;
  }

  buildIR(): IRExpression {
    let value: string | number | boolean;
    let type: AbiType;
    switch (this.expression.getKind()) {
      case SyntaxKind.StringLiteral: {
        const lit = this.expression as StringLiteral;
        value = lit.getLiteralText();
        type = AbiType.String;
        if (this.isAddress(value)) {
          type = AbiType.Address;
        }
        break;
      }
      case SyntaxKind.NumericLiteral: {
        const lit = this.expression as NumericLiteral;
        value = Number(lit.getLiteralText());
        type = AbiType.Uint256;
        break;
      }
      case SyntaxKind.TrueKeyword: {
        value = true;
        type = AbiType.Bool;
        break;
      }
      case SyntaxKind.FalseKeyword: {
        value = false;
        type = AbiType.Bool;
        break;
      }
      default:
        throw new Error(
          `LiteralIRBuilder: unsupported literal kind ${this.expression.getKindName()}`,
        );
    }

    return { kind: "literal", value, type };
  }
}
