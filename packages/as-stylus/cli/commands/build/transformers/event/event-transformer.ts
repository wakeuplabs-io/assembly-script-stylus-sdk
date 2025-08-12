import { BaseTypeTransformer } from "@/cli/commands/build/transformers/core/base-transformer.js";
import { ContractContext } from "@/cli/commands/build/transformers/core/contract-context.js";
import { IREvent, IRExpression } from "@/cli/types/ir.types.js";

import { EventEmitHandler } from "./handlers/emit-handler.js";

export class EventTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext, events: IREvent[]) {
    super(contractContext, "Event");
    this.registerHandler(new EventEmitHandler(contractContext, events));
  }

  canHandle(expr: IRExpression): boolean {
    if (!expr || expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".emit");
  }

  protected handleDefault() {
    return {
      setupLines: [],
      valueExpr: "/* unsupported event emit */",
    };
  }
}
