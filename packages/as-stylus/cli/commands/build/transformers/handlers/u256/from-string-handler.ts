import { EmitContext, EmitResult } from "../../../../../types/emit.types";
import { ExpressionHandler } from "../expression-handler";

/**
 * Handler for U256Factory.fromString() expressions
 */
export class U256FromStringHandler implements ExpressionHandler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    return expr.kind === "call" && 
           expr.target === "U256Factory.fromString" && 
           expr.args.length > 0 &&
           expr.args[0].kind === "literal";
  }
  
  /**
   * Processes U256Factory.fromString() expressions
   */
  handle(
    expr: any, 
    context: EmitContext, 
    emitExprFn: (expr: any, ctx: EmitContext) => EmitResult
  ): EmitResult {
    const raw = expr.args[0].value as string;
    const strId = context.strCounter++;
    const mallocId = `__str${strId}`;
    const u256Id = `__u256${strId}`;
    
    const setupLines = [
      `const ${mallocId} = malloc(${raw.length});`
    ];
    
    for (let i = 0; i < raw.length; i++) {
      setupLines.push(`store<u8>(${mallocId} + ${i}, ${raw.charCodeAt(i)});`);
    }
    
    setupLines.push(
      `const ${u256Id}: usize = U256.create();`,
      `U256.setFromString(${u256Id}, ${mallocId}, ${raw.length});`
    );
    
    return {
      setupLines,
      valueExpr: u256Id,
      valueType: "U256"
    };
  }
}
