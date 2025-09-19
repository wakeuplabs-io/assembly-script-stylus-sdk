import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { BaseTypeTransformer } from "@/transformers/core/base-transformer.js";

import { BinaryTransformer } from "./transformers/binary-transformer.js";
import { CallTransformer } from "./transformers/call-transformer.js";
import { ConditionTransformer } from "./transformers/condition-transformer.js";
import { FallbackTransformer } from "./transformers/fallback-transformer.js";
import { LiteralTransformer } from "./transformers/literal-transformer.js";
import { MappingTransformer } from "./transformers/mapping-transformer.js";
import { MemberTransformer } from "./transformers/member-transformer.js";
import { ThisTransformer } from "./transformers/this-transformer.js";
import { UnaryTransformer } from "./transformers/unary-transformer.js";
import { VariableTransformer } from "./transformers/variable-transformer.js";

type TransformerKind =
  | "this"
  | "member"
  | "call"
  | "binary"
  | "condition"
  | "unary"
  | "literal"
  | "var"
  | "map_get"
  | "map_set"
  | "map_get2"
  | "map_set2"
  | "fallback";

/**
 * Expression handler focused solely on expression transformation.
 * Context management is now handled by ExpressionContext.
 */
export class ExpressionHandler extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "expr");
  }

  private createTransformers(): Record<TransformerKind, Handler> {
    return {
      member: new MemberTransformer(this.contractContext),
      this: new ThisTransformer(this.contractContext),
      call: new CallTransformer(this.contractContext),
      binary: new BinaryTransformer(this.contractContext),
      condition: new ConditionTransformer(this.contractContext),
      unary: new UnaryTransformer(this.contractContext),
      literal: new LiteralTransformer(this.contractContext),
      var: new VariableTransformer(this.contractContext),
      map_get: new MappingTransformer(this.contractContext),
      map_set: new MappingTransformer(this.contractContext),
      map_get2: new MappingTransformer(this.contractContext),
      map_set2: new MappingTransformer(this.contractContext),
      fallback: new FallbackTransformer(this.contractContext),
    };
  }

  canHandle(expr: { kind: string }): boolean {
    const expressions = [
      "this",
      "expr",
      "call",
      "literal",
      "var",
      "member",
      "unary",
      "binary",
      "condition",
      "fallback",
      "map_get",
      "map_set",
      "map_get2",
      "map_set2",
    ];
    return expressions.includes(expr.kind);
  }

  /**
   * Main function to emit code from an expression.
   * Uses the provided context manager to get the appropriate context.
   */
  handle(expr: IRExpression): EmitResult {
    if (expr) {
      const transformer = this.createTransformers()[expr.kind as TransformerKind];
      if (transformer) {
        return transformer.handle(expr);
      }
    }

    return {
      setupLines: [],
      valueExpr: `/* Unsupported expression: ${expr} */`,
    };
  }
}
