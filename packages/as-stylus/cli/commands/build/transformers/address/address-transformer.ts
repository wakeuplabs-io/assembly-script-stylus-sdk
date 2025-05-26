import { EmitContext, EmitResult } from "../../../../types/emit.types.js";
import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";

import { AddressCreateHandler }   from "./handlers/create-handler.js";
// import { AddressFromStringHandler } from "./handlers/from-string-handler.js";
// import { AddressFromU256Handler }   from "./handlers/from-u256-handler.js";
// import { AddressEqualsHandler }   from "./handlers/equals-handler.js";
// import { AddressIsZeroHandler }   from "./handlers/is-zero-handler.js";
// import { AddressToStringHandler } from "./handlers/to-string-handler.js";


export class AddressTransformer extends BaseTypeTransformer {
  constructor() {
    super("Address");

    // Registrar handlers específicos
    this.registerHandler(new AddressCreateHandler());
    // this.registerHandler(new AddressFromStringHandler());
    // this.registerHandler(new AddressFromU256Handler());
    // this.registerHandler(new AddressEqualsHandler());
    // this.registerHandler(new AddressIsZeroHandler());
    // this.registerHandler(new AddressToStringHandler());
  }

  /** Determina si este transformer puede manejar la expresión */
  matchesType(expr: any): boolean {
    if (expr.kind !== "call") return false;

    const target = expr.target || "";

    // Factory
    if (
      target === "AddressFactory.create"   ||
      target === "AddressFactory.fromString" ||
      target === "AddressFactory.fromU256"
    ) {
      return true;
    }

    // Métodos de instancia
    return (
      target.endsWith(".equals")   ||
      target.endsWith(".isZero")   ||
      target.endsWith(".toString")
    );
  }

  /** Fallback si ningún handler aplica */
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

  /* helpers de storage */
  generateLoadCode(prop: string): string  { return `load_${prop}()`; }
  generateStoreCode(prop: string, val: string): string {
    return `store_${prop}(${val});`;
  }
}

// Instancia global + registro
export const AddressTransformerInstance = new AddressTransformer();
registerTransformer(AddressTransformerInstance);
