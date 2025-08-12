import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { AddressCopyHandler } from "./handlers/copy-handler.js";
import { AddressCreateHandler }   from "./handlers/create-handler.js";
import { AddressEqualsHandler } from "./handlers/equals-handler.js";
import { AddressFromStringHandler } from "./handlers/from-string-handler.js";
import { AddressHasCodeHandler } from "./handlers/has-code-handler.js";
import { AddressIsZeroHandler }   from "./handlers/is-zero-handler.js";
import { AddressToStringHandler } from "./handlers/to-string-handler.js";
import { ContractContext } from "../core/contract-context.js";

export class AddressTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "Address");

    this.registerHandler(new AddressCopyHandler(contractContext));
    this.registerHandler(new AddressCreateHandler(contractContext));
    this.registerHandler(new AddressFromStringHandler(contractContext));
    this.registerHandler(new AddressToStringHandler(contractContext));
    this.registerHandler(new AddressEqualsHandler(contractContext));
    this.registerHandler(new AddressIsZeroHandler(contractContext));
    this.registerHandler(new AddressHasCodeHandler(contractContext));
  }

  canHandle(expr: IRExpression): boolean {
    if (!expr || expr.kind !== "call") return false;

    const target = expr.target || "";
    
    // Legacy factory methods
    if (["AddressFactory.create", "AddressFactory.fromString", "Address.copy"].includes(target)) {
      return true;
    }
    
    // Factory methods with receiver structure
    if ((target === "create" || target === "fromString") && expr.receiver) {
      if (expr.receiver.kind === "var" && expr.receiver.name === "AddressFactory") {
        return true;
      }
    }

    // Legacy method calls
    if (target.endsWith(".equals") || target.endsWith(".isZero") || target.endsWith(".hasCode")) {
      return true;
    }
    
    // Method calls with receiver structure
    if (expr.receiver && ["equals", "isZero", "hasCode", "toString"].includes(target)) {
      // Check if receiver is Address type or returns Address type
      const receiverIsAddress = expr.receiver.type === AbiType.Address;
      const receiverReturnsAddress = expr.receiver.kind === "call" && 
                                    (expr.receiver.returnType === AbiType.Address);
      
      return receiverIsAddress || 
             receiverReturnsAddress ||
             (expr.returnType as AbiType) === AbiType.Bool || // address methods can return bool
             (expr.returnType as AbiType) === AbiType.String; // toString returns string
    }

    if (target.endsWith(".toString")) {
      return expr.args.length === 0 && expr.returnType === AbiType.Address;
    }

    return false;
  }
}
