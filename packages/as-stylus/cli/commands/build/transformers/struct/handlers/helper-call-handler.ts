import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRStruct, Member } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * Handler for direct struct helper function calls like StructTest_get_to()
 */
export class StructHelperCallHandler extends Handler {
  private structs: Map<string, IRStruct>;

  constructor(contractContext: ContractContext, structs: Map<string, IRStruct>) {
    super(contractContext);
    this.structs = structs;
  }

  canHandle(expr: Call | Member): boolean {
    if (expr.kind !== "call") return false;

    const target = expr.target || "";

    if (target.includes("_get_") || target.includes("_set_")) {
      const parts = target.split("_");
      if (parts.length >= 3) {
        const structName = parts[0];
        return this.structs.has(structName);
      }
    }

    return false;
  }

  handle(expr: Call): EmitResult {
    const target = expr.target || "";

    const argResults: EmitResult[] = [];
    if (expr.args && expr.args.length > 0) {
      for (const arg of expr.args) {
        argResults.push(this.contractContext.emitExpression(arg));
      }
    }

    const setupLines: string[] = [];
    for (const argResult of argResults) {
      setupLines.push(...argResult.setupLines);
    }

    const argExprs = argResults.map((result) => result.valueExpr);
    const functionCall = `${target}(${argExprs.join(", ")})`;

    let returnType = "usize";

    if (target.includes("_get_")) {
      const parts = target.split("_get_");
      if (parts.length === 2) {
        const structName = parts[0];
        const fieldName = parts[1];
        const struct = this.structs.get(structName);

        if (struct) {
          const field = struct.fields.find((f) => f.name === fieldName);
          if (field) {
            switch (field.type) {
              case AbiType.Address:
                returnType = "Address";
                break;
              case AbiType.String:
                returnType = "Str";
                break;
              case AbiType.Uint256:
                returnType = "U256";
                break;
              case AbiType.Bool:
                returnType = "boolean";
                break;
              default:
                returnType = "usize";
            }
          }
        }
      }
    }

    return {
      setupLines,
      valueExpr: functionCall,
      valueType: returnType,
    };
  }
}
