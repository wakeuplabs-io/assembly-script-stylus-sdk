import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRErrorDecl, IRExpression } from "@/cli/types/ir.types.js";

import { ContractContext } from "../../core/contract-context.js";
import { Handler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class ErrorRevertHandler extends Handler {
  private errorsMap: Map<string, IRErrorDecl>;

  constructor(contractContext: ContractContext, errors: IRErrorDecl[]) {
    super(contractContext);
    this.errorsMap = new Map(errors.map(e => [e.name, e]));
  }

  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "call" &&
      typeof expr.target === "string" &&
      expr.target.endsWith(".revert")
    );
  }

  handle(expr: Call): EmitResult {
    const errorName = expr.target.replace(/\.revert$/, "");
    const errorDecl = this.errorsMap.get(errorName);
    
    if (!errorDecl) {
      return {
        setupLines: [],
        valueExpr: `/* Unknown error ${errorName} */`,
      };
    }

    const setup: string[] = [];
    const errorDataTemp = makeTemp("errorData");

    setup.push(`// Revert with custom error ${errorName}`);

    if (errorDecl.fields.length === 0) {
      // Error sin parámetros - solo usar el selector
      setup.push(`const ${errorDataTemp}: usize = malloc(4);`);
      setup.push(`__write_error_selector_${errorName}(${errorDataTemp});`);
      setup.push(`abort_with_data(${errorDataTemp}, 4);`);
    } else {
      const argResults: string[] = [];
      
      expr.args.forEach((arg: IRExpression) => {
        const argResult = this.contractContext.emit(arg);
        setup.push(...argResult.setupLines);
        argResults.push(argResult.valueExpr);
      });

      const argsList = argResults.join(", ");
      setup.push(`const ${errorDataTemp}: usize = __create_error_data_${errorName}(${argsList});`);
      
      const totalSize = 4 + (errorDecl.fields.length * 32);
      setup.push(`abort_with_data(${errorDataTemp}, ${totalSize});`);
    }

    return {
      setupLines: setup,
      valueExpr: "/* Custom error reverted */",
    };
  }
} 