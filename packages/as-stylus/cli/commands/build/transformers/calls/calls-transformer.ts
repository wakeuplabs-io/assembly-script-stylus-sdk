import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
import { CallHandler } from "./handlers/call-handler.js";
import { DelegateCallHandler } from "./handlers/delegate-call-handler.js";
import { SendHandler } from "./handlers/send-handler.js";
import { StaticCallHandler } from "./handlers/static-call-handler.js";
import { TransferHandler } from "./handlers/transfer-handler.js";

export class CallsTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "CallFactory");
    
    this.registerHandler(new CallHandler(contractContext));
    this.registerHandler(new DelegateCallHandler(contractContext));
    this.registerHandler(new StaticCallHandler(contractContext));
    this.registerHandler(new TransferHandler(contractContext));
    this.registerHandler(new SendHandler(contractContext));
  }

  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.startsWith("CallFactory.");
  }
}