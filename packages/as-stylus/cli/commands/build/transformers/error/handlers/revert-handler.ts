import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";
import { IRErrorDecl } from "@/cli/types/ir.types.js";

import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class ErrorRevertHandler implements ExpressionHandler {
  private errorsMap: Map<string, IRErrorDecl>;

  constructor(errors: IRErrorDecl[]) {
    this.errorsMap = new Map(errors.map(e => [e.name, e]));
  }

  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      typeof expr.target === "string" &&
      expr.target.endsWith(".revert")
    );
  }

  handle(
    expr: any,
    ctx: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
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

    // Calcular el tamaño total del error data
    // 4 bytes para el selector + 32 bytes por cada campo
    const totalSize = 4 + (errorDecl.fields.length * 32);
    
    setup.push(`// Revert with custom error ${errorName}`);
    setup.push(`const ${errorDataTemp}: usize = malloc(${totalSize});`);
    
    // Escribir el selector (primeros 4 bytes)
    const selectorBytes = this.hexToBytes(errorDecl.selector);
    selectorBytes.forEach((byte, index) => {
      setup.push(`store<u8>(${errorDataTemp} + ${index}, ${byte});`);
    });

    // Escribir los argumentos (cada uno en 32 bytes)
    expr.args.forEach((arg: any, index: number) => {
      const argResult = emit(arg, ctx);
      setup.push(...argResult.setupLines);
      
      const offset = 4 + (index * 32);
      setup.push(`// Argument ${index + 1}: ${errorDecl.fields[index]?.name || 'unknown'}`);
      setup.push(`U256.copy(${errorDataTemp} + ${offset}, ${argResult.valueExpr});`);
    });

    // Hacer el revert con los datos del error
    setup.push(`// Revert with error data`);
    setup.push(`abort_with_data(${errorDataTemp}, ${totalSize});`);

    return {
      setupLines: setup,
      valueExpr: "/* Custom error reverted */",
    };
  }

  private hexToBytes(hex: string): string[] {
    // Remover el "0x" si está presente
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes: string[] = [];
    
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = cleanHex.substring(i, i + 2);
      bytes.push(`0x${byte}`);
    }
    
    return bytes;
  }
} 