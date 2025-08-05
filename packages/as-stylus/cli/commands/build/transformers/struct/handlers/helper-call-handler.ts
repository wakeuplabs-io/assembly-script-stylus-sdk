import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { IRStruct } from "../../../../../types/ir.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for direct struct helper function calls like StructTest_get_to()
 */
export class StructHelperCallHandler implements ExpressionHandler {
  private structs: Map<string, IRStruct>;

  constructor(structs: Map<string, IRStruct>) {
    this.structs = structs;
  }

  canHandle(expr: any): boolean {
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

  handle(
    expr: any,
    context: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult,
  ): EmitResult {
    const target = expr.target || "";

    const argResults: EmitResult[] = [];
    if (expr.args && expr.args.length > 0) {
      for (const arg of expr.args) {
        argResults.push(emit(arg, context));
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
              case "address":
                returnType = "Address";
                break;
              case "string":
                returnType = "Str";
                break;
              case "uint256":
                returnType = "U256";
                break;
              case "bool":
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
