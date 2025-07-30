import { EmitContext, EmitResult } from "../../../../types/emit.types.js";
import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";
import { AddressCopyHandler } from "./handlers/copy-handler.js";
import { AddressCreateHandler }   from "./handlers/create-handler.js";
import { AddressEqualsHandler } from "./handlers/equals-handler.js";
import { AddressFromStringHandler } from "./handlers/from-string-handler.js";
import { AddressHasCodeHandler } from "./handlers/has-code-handler.js";
import { AddressIsZeroHandler }   from "./handlers/is-zero-handler.js";
import { AddressToStringHandler } from "./handlers/to-string-handler.js";

export class AddressTransformer extends BaseTypeTransformer {
  constructor() {
    super("Address");

    this.registerHandler(new AddressCopyHandler());
    this.registerHandler(new AddressCreateHandler());
    this.registerHandler(new AddressFromStringHandler());
    this.registerHandler(new AddressToStringHandler());
    this.registerHandler(new AddressEqualsHandler());
    this.registerHandler(new AddressIsZeroHandler());
    this.registerHandler(new AddressHasCodeHandler());
  }

  matchesType(expr: any): boolean {
    if (!expr ||expr.kind !== "call") return false;

    const target = expr.target || "";
    return (
      target === "AddressFactory.create"   ||
      target === "AddressFactory.fromString" ||
      target === "Address.copy" ||
      target.endsWith(".equals")   ||
      target.endsWith(".isZero")   ||
      target.endsWith(".toString") ||
      target.endsWith(".hasCode")
    );
  }

  protected handleDefault(
    expr: any,
    _ctx: EmitContext,
    _emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Unsupported Address expression: ${expr.kind} */`,
      valueType: "Address"
    };
  }

  generateLoadCode(prop: string): string  { return `load_${prop}()`; }
}

export const AddressTransformerInstance = new AddressTransformer();
registerTransformer(AddressTransformerInstance);
