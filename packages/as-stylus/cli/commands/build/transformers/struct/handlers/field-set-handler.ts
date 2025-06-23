import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { IRStruct } from "../../../../../types/ir.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

export class StructFieldSetHandler implements ExpressionHandler {
  private structs: Map<string, IRStruct>;

  constructor(structs: Map<string, IRStruct>) {
    this.structs = structs;
  }

  canHandle(expr: any): boolean {
    if (expr.kind !== "call" || !expr.target) return false;
    
    const target = expr.target;
    
    // Detect setter calls: StructName_set_field
    if (target.includes("_set_")) {
      const parts = target.split("_set_");
      if (parts.length === 2) {
        const structName = parts[0];
        const fieldName = parts[1];
        const struct = this.structs.get(structName);
        
        if (struct) {
          // Check if the field exists
          const field = struct.fields.find(f => f.name === fieldName);
          return !!field;
        }
      }
    }
    
    return false;
  }

  handle(
    expr: any,
    ctx: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const target = expr.target;
    const parts = target.split("_set_");
    const structName = parts[0];
    const fieldName = parts[1];
    
    if (!expr.args || expr.args.length !== 2) {
      return {
        setupLines: [],
        valueExpr: `/* Invalid args for ${target} */`,
        valueType: "void"
      };
    }
    
    const objectArg = emit(expr.args[0], ctx);
    const valueArg = emit(expr.args[1], ctx);
    
    return {
      setupLines: [
        ...objectArg.setupLines,
        ...valueArg.setupLines,
        `${structName}_set_${fieldName}(${objectArg.valueExpr}, ${valueArg.valueExpr});`
      ],
      valueExpr: "/* void */",
      valueType: "void"
    };
  }
} 