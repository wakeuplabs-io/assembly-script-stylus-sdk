import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { IRStruct } from "../../../../../types/ir.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

/**
 * Handler for property_set calls like property_set(structTemp, "fieldName", value)
 * This is used to set the value of a field on a struct
 */
export class StructPropertySetHandler implements ExpressionHandler {
  private structs: Map<string, IRStruct>;

  constructor(structs: Map<string, IRStruct>) {
    this.structs = structs;
  }

  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;

    const target = expr.target || "";
    return target === "property_set" && expr.args && expr.args.length === 3;
  }

  handle(
    expr: any,
    context: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult,
  ): EmitResult {
    const objectArg = expr.args[0];
    const fieldNameArg = expr.args[1];
    const valueArg = expr.args[2];

    const objectResult = emit(objectArg, context);
    const valueResult = emit(valueArg, context);

    const fieldName = fieldNameArg.value || fieldNameArg.name;

    if (!fieldName) {
      return {
        setupLines: [...objectResult.setupLines, ...valueResult.setupLines],
        valueExpr: `/* property_set: missing field name */`,
        valueType: "void",
      };
    }

    const structNames = Array.from(this.structs.keys());
    if (structNames.length === 0) {
      return {
        setupLines: [...objectResult.setupLines, ...valueResult.setupLines],
        valueExpr: `/* property_set: no structs registered */`,
        valueType: "void",
      };
    }

    const structName = structNames[0];

    const isStorageStruct = this.isStorageStruct(objectArg);

    const setterPrefix = isStorageStruct ? `${structName}_set_` : `${structName}_memory_set_`;
    const setterCall = `${setterPrefix}${fieldName}(${objectResult.valueExpr}, ${valueResult.valueExpr})`;

    return {
      setupLines: [...objectResult.setupLines, ...valueResult.setupLines, setterCall + ";"],
      valueExpr: "/* void */",
      valueType: "void",
    };
  }

  private isStorageStruct(objectArg: unknown): boolean {
    if (objectArg && (objectArg as { scope?: string }).scope === "storage") {
      return true;
    }

    return false;
  }
}
