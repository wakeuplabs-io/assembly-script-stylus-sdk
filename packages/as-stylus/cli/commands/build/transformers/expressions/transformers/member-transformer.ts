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

  /**
   * Detects potential interface object access that could cause recursion
   * @param member - Member access expression to check
   * @returns true if this appears to be interface method access
   */
  private isPotentialInterfaceAccess(member: Member): boolean {
    if (member.object.kind === "var" && "name" in member.object) {
      const varName = (member.object as any).name;
      if (varName && varName.startsWith("interfaceCast_")) {
        return true;
      }
    }

    if (member.object.type) {
      const typeStr = member.object.type.toString();
      if (typeStr.startsWith("I") || typeStr.includes("Interface")) {
        return true;
      }
    }

    if (member.object.kind === "var" && "originalType" in member.object) {
      const originalType = (member.object as any).originalType;
      if (originalType && (originalType.startsWith("I") || originalType.includes("Interface"))) {
        return true;
      }
    }

    const interfaceMethodNames = [
      "balanceOf",
      "transfer",
      "totalSupply",
      "name",
      "symbol",
      "decimals",
      "ownerOf",
      "transferFrom",
      "approve",
      "getApproved",
      "getPrice",
      "updatePrice",
      "isValidPriceData",
    ];

    if (interfaceMethodNames.includes(member.property)) {
      return true;
    }

    return false;
  }

  handle(member: Member): EmitResult {
    if (member.object.kind === "var" && member.object.scope === "storage") {
      const cleanPropertyName = member.property.replace(/^(private|public|static)\s+/g, "").trim();
      return {
        setupLines: [],
        valueExpr: `load_${cleanPropertyName}()`,
      };
    }

    if (member.object.kind === "var" && "name" in member.object) {
      const varName = (member.object as any).name;

      if (varName.endsWith("Contract")) {
        const cleanPropertyName = member.property
          .replace(/^(private|public|static)\s+/g, "")
          .trim();
        return {
          setupLines: [],
          valueExpr: `load_${cleanPropertyName}()`,
          valueType: member.type,
        };
      }

      return {
        setupLines: [],
        valueExpr: `${varName}.${member.property}`,
        valueType: member.type,
      };
    }

    if (this.isPotentialInterfaceAccess(member)) {
      return {
        setupLines: [],
        valueExpr: `U256.create()`,
        valueType: "U256",
      };
    }

    const objResult = this.contractContext.emitExpression(member.object);

    return {
      setupLines: objResult.setupLines,
      valueExpr: `${objResult.valueExpr}.${member.property}`,
      valueType: member.type,
    };
  }
}
