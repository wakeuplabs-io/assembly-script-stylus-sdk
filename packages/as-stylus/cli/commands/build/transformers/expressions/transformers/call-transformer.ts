import { AbiType } from "../../../../../types/abi.types.js";
import { EmitResult, EmitContext } from "../../../../../types/emit.types.js";
import { IRExpression, Call } from "../../../../../types/ir.types.js";
import { detectExpressionType, typeTransformers } from "../../core/base-transformer.js";
import { IExpressionTransformer } from "../interfaces/expression-transformer.interface.js";

/**
 * Transformer for function call expressions.
 * Handles function calls with proper argument transformation and return type handling.
 */
export class CallTransformer implements IExpressionTransformer {
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "call";
  }

  transform(
    expr: IRExpression,
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const call = expr as Call;

    // 
    const typeName = detectExpressionType(expr);
    const transformer = typeName ? typeTransformers[typeName] : null;
    if (transformer && typeof transformer.emit === 'function') {
      return transformer.emit(expr, context, emitExpression);
    }

    
    // Handle super constructor calls
    if (call.target === "super") {
      const argResults = this.transformArguments(call.args, context, emitExpression);
      const allSetupLines = this.combineSetupLines(argResults);
      
      return {
        setupLines: allSetupLines,
        valueExpr: `${context.parentName}_constructor(${argResults.map(r => r.valueExpr).join(", ")})`
      };
    }
    
    // Transform arguments
    const argResults = this.transformArguments(call.args, context, emitExpression);
    const allSetupLines = this.combineSetupLines(argResults);
    const argValues = argResults.map(r => r.valueExpr).join(", ");
    
    // Handle different return types
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

  private transformArguments(
    args: IRExpression[],
    context: EmitContext,
    emitExpression: (expr: IRExpression, ctx: EmitContext) => EmitResult
  ): EmitResult[] {
    return args.map(arg => emitExpression(arg, context));
  }

  private combineSetupLines(argResults: EmitResult[]): string[] {
    return argResults.reduce((acc: string[], result: EmitResult) => {
      return acc.concat(result.setupLines);
    }, []);
  }
}
