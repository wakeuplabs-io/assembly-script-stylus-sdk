import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";


export class AddressCopyHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: Call): boolean {
    const target = expr.target || "";

    if (target !== "Address.copy") return false;
    if (expr.args.length !== 1 && expr.args[0].type !== AbiType.Address) return false;

    return true;
  }

  handle(expr: Call): EmitResult {
    const srcArg = this.contractContext.emitExpression(expr.args[0]);
    const dstPtr = makeTemp("addrCopy");

    return {
      setupLines: [
        ...srcArg.setupLines,
        `const ${dstPtr}: usize = Address.copyNew(${srcArg.valueExpr});`
      ],
      valueExpr: dstPtr,
      valueType: "Address",
    };
  }
} 