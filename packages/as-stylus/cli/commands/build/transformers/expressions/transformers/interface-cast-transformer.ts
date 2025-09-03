import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRInterfaceCast } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/**
 * Transformer for interface casting expressions.
 * Handles: (address as IERC20) -> creates interface wrapper object
 */
export class InterfaceCastTransformer extends Handler {
  private static castCounter: number = 0;

  constructor(contractContext: ContractContext) {
    super(contractContext);
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "interface_cast";
  }

  handle(cast: IRInterfaceCast): EmitResult {
    const expressionResult = this.contractContext.emitExpression(cast.expression);

    const setupLines: string[] = [...expressionResult.setupLines];
    const uniqueId = ++InterfaceCastTransformer.castCounter;
    const castVarName = `interfaceCast_${uniqueId}`;

    // Create InterfaceCast using the core AssemblyScript type
    setupLines.push(
      `const ${castVarName} = InterfaceCast.create(${expressionResult.valueExpr}, "${cast.interfaceName}");`,
    );

    return {
      setupLines,
      valueExpr: castVarName,
      valueType: cast.interfaceName,
    };
  }
}
