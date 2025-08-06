import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";
import { Handler } from "@/transformers/core/interfaces.js";

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

    return this.contractContext.emit(call);
  }

  private transformArguments(args: IRExpression[]): EmitResult[] {
    return args.map(arg => this.contractContext.emit(arg));
  }

  private combineSetupLines(argResults: EmitResult[]): string[] {
    return argResults.reduce((acc: string[], result: EmitResult) => {
      return acc.concat(result.setupLines);
    }, []);
  }
}
