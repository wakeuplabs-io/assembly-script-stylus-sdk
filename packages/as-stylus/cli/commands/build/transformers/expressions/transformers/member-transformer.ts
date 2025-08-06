import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Member } from "@/cli/types/ir.types.js";

/**
 * Transformer for member access expressions.
 * Handles property access on objects and storage properties.
 */
export class MemberTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }


  canHandle(expr: IRExpression): boolean {
    return expr.kind === "member";
  }

  handle(member: Member): EmitResult {
    if (member.object.kind === "var" && member.object.scope === "storage") {
      return {
        setupLines: [],
        valueExpr: `load_${member.property}()`
      };
    }

    const result = this.contractContext.emitExpression(member);
    if (result.setupLines.length > 0) {
      return result;
    }

    const objResult = this.contractContext.emitExpression(member.object);
    
    return {
      setupLines: objResult.setupLines,
      valueExpr: `${objResult.valueExpr}.${member.property}`
    };
  }
}