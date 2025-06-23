import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { IRStruct } from "../../../../../types/ir.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class StructCreateHandler implements ExpressionHandler {
  private structs: Map<string, IRStruct>;

  constructor(structs: Map<string, IRStruct>) {
    this.structs = structs;
  }

  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      expr.target &&
      expr.target.startsWith("new ") &&
      expr.target.endsWith("()") &&
      this.structs.has(expr.target.slice(4, -2))
    );
  }

  handle(
    expr: any,
    _ctx: EmitContext,
    _emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const structName = expr.target.slice(4, -2); // Remove "new " and "()"
    const struct = this.structs.get(structName);
    
    if (!struct) {
      return {
        setupLines: [],
        valueExpr: "0",
        valueType: "usize"
      };
    }

    const structPtr = makeTemp("structPtr");
    
    return {
      setupLines: [`const ${structPtr}: usize = ${structName}_alloc();`],
      valueExpr: structPtr,
      valueType: "usize"
    };
  }
} 