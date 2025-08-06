import { AbiType } from "../../../../../types/abi.types.js";
import { EmitResult } from "../../../../../types/emit.types.js";
import { IRExpression, Call } from "../../../../../types/ir.types.js";
import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";

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
    const result = this.contractContext.emit(call);
    if (result.setupLines.length > 0) {
      return result;
    }

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
    
    return {
      setupLines: allSetupLines,
      valueExpr: baseCall
    };
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
