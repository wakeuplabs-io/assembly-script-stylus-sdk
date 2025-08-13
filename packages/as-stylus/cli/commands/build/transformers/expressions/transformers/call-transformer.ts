import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * Transformer for function call expressions.
 * Handles function calls with proper argument transformation and return type handling.
 */
export class CallTransformer extends Handler {
  constructor(contractContext: ContractContext) {
    super(contractContext);
  }
  
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "call";
  }

  handle(call: Call): EmitResult {
    if (call.target === "super") {
      const argResults = this.transformArguments(call.args);
      const allSetupLines = this.combineSetupLines(argResults);
      
      return {
        setupLines: allSetupLines,
        valueExpr: `${this.contractContext.getParentName()}_constructor(${argResults.map(r => r.valueExpr).join(", ")})`
      };
    }

    // Handle chained calls with receiver field
    // BUT first check if this should be handled by a type-specific transformer
    if ('receiver' in call && call.receiver) {
      // Let type-specific transformers handle type-specific chained calls
      // Only handle generic chained calls that don't belong to specific types
      if (!this.shouldDeferToTypeSpecificTransformer(call)) {
        return this.handleChainedCall(call);
      }
    }

    // Handle regular calls without receiver
    const argResults = this.transformArguments(call.args);
    const allSetupLines = this.combineSetupLines(argResults);
    const argValues = argResults.map(r => r.valueExpr).join(", ");
    
    const baseCall = `${call.target}(${argValues})`;
    
    if (call.returnType === AbiType.Bool) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Boolean.fromABI(${baseCall})`
      };
    }
    
    if (call.returnType === AbiType.String) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Str.fromABI(${baseCall})`
      };
    }

    if (call.type === AbiType.UserDefinedFunction) {
      return {
        setupLines: allSetupLines,
        valueExpr: baseCall
      };
    }

    // Fallback: return the base call without re-delegating to avoid infinite loops
    return {
      setupLines: allSetupLines,
      valueExpr: baseCall
    };
  }

  /**
   * Handles chained calls with receiver field
   */
  private handleChainedCall(call: Call): EmitResult {
    // Ensure receiver exists (should always be true when this method is called)
    if (!call.receiver) {
      throw new Error("handleChainedCall called on call without receiver");
    }
    
    // Transform the receiver first
    const receiverResult = this.contractContext.emitExpression(call.receiver);
    
    // Transform the arguments
    const argResults = this.transformArguments(call.args);
    
    // Combine all setup lines
    const allSetupLines = [
      ...receiverResult.setupLines,
      ...this.combineSetupLines(argResults)
    ];
    
    const argValues = argResults.map(r => r.valueExpr).join(", ");
    const chainedCall = argValues 
      ? `${receiverResult.valueExpr}.${call.target}(${argValues})`
      : `${receiverResult.valueExpr}.${call.target}()`;
    
    // Handle return type conversions for chained calls
    if (call.returnType === AbiType.Bool) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Boolean.fromABI(${chainedCall})`
      };
    }
    
    if (call.returnType === AbiType.String) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Str.fromABI(${chainedCall})`
      };
    }

    return {
      setupLines: allSetupLines,
      valueExpr: chainedCall
    };
  }

  private transformArguments(args: IRExpression[]): EmitResult[] {
    return args.map(arg => this.contractContext.emitExpression(arg));
  }

  private combineSetupLines(argResults: EmitResult[]): string[] {
    return argResults.reduce((acc: string[], result: EmitResult) => {
      return acc.concat(result.setupLines);
    }, []);
  }

  /**
   * Determines if a chained call should be handled by a type-specific transformer
   */
  private shouldDeferToTypeSpecificTransformer(call: Call): boolean {
    const target = call.target || "";
    
    // Check if this is a type-specific method
    const typeSpecificMethods = [
      // U256/I256 methods
      "add", "sub", "mul", "div", "mod", "pow",
      "lessThan", "greaterThan", "equals", "notEqual",
      "lessThanOrEqual", "greaterThanOrEqual",
      "toString", "copy",
      
      // Address methods  
      "isZero", "hasCode",
      
      // String methods
      "length", "slice",
      
      // Factory methods
      "create", "fromString", "fromU256"
    ];
    
    if (typeSpecificMethods.includes(target)) {
      // Check if receiver has a type that would be handled by specific transformers
      if (call.receiver) {
        const receiverType = call.receiver.type;
        const receiverReturnType = call.receiver.kind === "call" ? call.receiver.returnType : null;
        
        // If receiver is or returns a specific type, defer to specific transformer
        return receiverType === AbiType.Uint256 || 
               receiverType === AbiType.Int256 || 
               receiverType === AbiType.Address ||
               receiverType === AbiType.String ||
               receiverReturnType === AbiType.Uint256 ||
               receiverReturnType === AbiType.Int256 ||
               receiverReturnType === AbiType.Address ||
               receiverReturnType === AbiType.String ||
               // Factory calls should also be deferred
               (call.receiver.kind === "var" && 
                ["U256Factory", "I256Factory", "AddressFactory", "StrFactory"].includes(call.receiver.name || ""));
      }
    }
    
    return false;
  }
}
