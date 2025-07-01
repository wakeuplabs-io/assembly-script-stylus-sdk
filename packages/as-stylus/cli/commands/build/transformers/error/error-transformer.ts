import { IRContract, IRErrorDecl } from "@/cli/types/ir.types.js";

import { convertType } from "../../builder/build-abi.js";
import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";
import { ErrorRevertHandler } from "./handlers/revert-handler.js";

export class ErrorTransformer extends BaseTypeTransformer {
  private errors: IRErrorDecl[];

  constructor(errors: IRErrorDecl[]) {
    super("Error");
    this.errors = errors;
    this.registerHandler(new ErrorRevertHandler(errors));
  }

  matchesType(expr: any): boolean {
    return (
      expr.kind === "call" &&
      typeof expr.target === "string" &&
      expr.target.endsWith(".revert")
    );
  }

  protected handleDefault() {
    return {
      setupLines: [],
      valueExpr: "/* unsupported error operation */",
    };
  }
  
  generateLoadCode(_property: string): string {
    return `/* Errors do not support load operations */`;
  }
  
  generateStoreCode(_property: string, _valueExpr: string): string {
    return `/* Errors do not support store operations */`;
  }
}

export function registerErrorTransformer(contract: IRContract): string[] {
  const lines: string[] = [];

  if (contract.errors && contract.errors.length > 0) {
    const errors = contract.errors;
    const instance = new ErrorTransformer(errors);
    registerTransformer(instance);

    // Generar función helper para abortar con datos de error
    lines.push(`// Custom error helper function`);
    lines.push(`export function abort_with_data(dataPtr: usize, dataLen: usize): void {`);
    lines.push(`  // TODO: Implement custom error abort mechanism`);
    lines.push(`  // For now, use regular abort`);
    lines.push(`  abort("Custom error", "", 0, 0);`);
    lines.push(`}`);
    lines.push("");

    // Generar información de errores como comentarios
    for (const error of errors) {
      lines.push(`// Error: ${error.name}`);
      lines.push(`// Selector: ${error.selector}`);
      lines.push(`// Fields: ${error.fields.map(f => `${f.name}:${f.type}`).join(", ")}`);
      lines.push("");
    }
  }

  return lines;
}

export function generateErrorABI(contract: IRContract): any[] {
  const errorABI: any[] = [];

  if (contract.errors && contract.errors.length > 0) {
    for (const error of contract.errors) {
      errorABI.push({
        type: "error",
        name: error.name,
        inputs: error.fields.map(field => ({
          name: field.name,
          type: convertType(field.type),
          internalType: field.type
        }))
      });
    }
  }

  return errorABI;
} 