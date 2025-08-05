import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";

import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

/** a.equals(b)  →  Address.equals(a,b)  */
export class AddressEqualsHandler extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    if (!expr || expr.kind !== "call") return false;
    const target = expr.target || "";

    return target.endsWith(".equals");
  }

  private makeReceiver(chain: string): IRExpression {
    if (chain.indexOf(".") === -1) {
      return { kind: "var" as const, name: chain, type: AbiType.Address, scope: "memory" };
    }
    const [head, ...rest] = chain.split(".");
    let node: IRExpression = { kind: "var" as const, name: head, type: AbiType.Address, scope: "memory" };
    for (const prop of rest) {
      node = { kind: "member" as const, object: node, property: prop, type: AbiType.Address };
    }
    return node;
  }

  handle(expr: Call): EmitResult {
    if (!expr.receiver && expr.target.endsWith(".equals")) {
      if (!expr.receiver) {
        const chain = expr.target.slice(0, -".equals".length);
        expr.receiver = this.makeReceiver(chain);
      }
      expr.target = "Address.equals";
    }


    const left = expr.receiver ? this.contractContext.emit(expr.receiver) : { setupLines: [], valueExpr: "undefined" };
    const right = this.contractContext.emit(expr.args[0]);

    return {
      setupLines: [...left.setupLines, ...right.setupLines],
      valueExpr: `Address.equals(${left.valueExpr}, ${right.valueExpr})`,
      valueType: "bool",
    };
  }
}
