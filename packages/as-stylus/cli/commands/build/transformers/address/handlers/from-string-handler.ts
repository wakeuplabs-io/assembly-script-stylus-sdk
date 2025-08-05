// src/emit/transformers/address/handlers/address-from-string.ts
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { EmitResult } from "../../../../../types/emit.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

/**
 * AddressFactory.fromString(...)
 *
 *   • If the argument is **literal** ("0x..."), copies the ASCII bytes
 *     at compile-time and parses them with Address.setFromStringHex.
 *
 *   • If it comes from the ABI (word offset) decodes:
 *        offset → lenPtr → len → dataPtr
 *     and also calls Address.setFromStringHex.
 *
 * The result is a buffer of 20 raw bytes (big-endian) ready to use.
 */
export class AddressFromStringHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "call" &&
      expr.target === "AddressFactory.fromString" &&
      expr.args.length === 1 &&
      ["literal", "var"].includes(expr.args[0].kind)
    );
  }

  handle(expr: Call): EmitResult {
    const arg    = expr.args[0];
    const argIR  = this.contractContext.emit(arg);
    const setup  = [...argIR.setupLines];

    const hexPtr = makeTemp("hexPtr");
    const hexLen = makeTemp("hexLen");
    const addr   = makeTemp("addrPtr");

    if (arg.kind === "literal") {
      const raw: string = arg.value as string;
      const L = raw.length;

      setup.push(`const ${hexPtr}: usize = malloc(${L});`);
      for (let i = 0; i < L; ++i) {
        setup.push(`store<u8>(${hexPtr} + ${i}, ${raw.charCodeAt(i)});`);
      }
      setup.push(`const ${hexLen}: u32 = ${L};`);
    }

    else {
      const offBE  = makeTemp("offBE");
      const lenPtr = makeTemp("lenPtr");

      setup.push(`const ${offBE}: u32 = loadU32BE(${argIR.valueExpr} + 28);`);
      setup.push(`const ${lenPtr}: usize = argsStart + ${offBE};`);
      setup.push(`const ${hexLen}: u32 = loadU32BE(${lenPtr} + 28);`);
      setup.push(`const ${hexPtr}: usize = ${lenPtr} + 32;`);
    }

    setup.push(`const ${addr}: usize = Address.create();`);
    setup.push(`Address.setFromStringHex(${addr}, ${hexPtr}, ${hexLen});`);

    return {
      setupLines: setup,
      valueExpr : addr,
      valueType : "Address",
    };
  }
}
