import { EmitContext, EmitResult } from "../../../../types/emit.types.js";
import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";
import { StrCreateHandler } from "./handlers/create-handler.js";
import { StrFromStringHandler } from "./handlers/from-string-handler.js";
import { StrLengthHandler } from "./handlers/length-handler.js";
import { StrSliceHandler } from "./handlers/slice-handler.js";
import { StrToStringHandler } from "./handlers/to-string-handler.js";


export class StrTransformer extends BaseTypeTransformer {
  constructor() {
    super("Str");

    this.registerHandler(new StrCreateHandler());
    this.registerHandler(new StrFromStringHandler());
    this.registerHandler(new StrToStringHandler());
    this.registerHandler(new StrSliceHandler());
    this.registerHandler(new StrLengthHandler());
  }

  matchesType(expr: any): boolean {
    if (!expr || expr.kind !== "call") return false;
    const target = expr.target || "";
    return (
      target === "strFactory.create" ||
      target === "StrFactory.fromString" ||
      target.endsWith(".toString") ||
      target.endsWith(".slice") ||
      target.endsWith(".length")
    );
  }

  protected handleDefault(
    expr: any,
    _ctx: EmitContext,
    _emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Unsupported Str expression: ${expr.kind} */`,
      valueType: "Str"
    };
  }

  generateLoadCode(prop: string): string {
    return `load_${prop}()`;
  }

  generateStoreCode(prop: string, val: string): string {
    return `store_${prop}(${val});`;
  }
}

export const StrTransformerInstance = new StrTransformer();
registerTransformer(StrTransformerInstance);
