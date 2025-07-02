import { toFunctionSelector } from "viem";

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

export function generateErrorSignature(error: IRErrorDecl): string {
  const signature = `${error.name}(${error.fields.map(f => mapTypeToAbi(f.type)).join(",")})`;
  return signature;
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
    lines.push(`  // TODO: Implement proper custom error abort mechanism`);
    lines.push(`  // For now, use unreachable() to abort execution`);
    lines.push(`  unreachable();`);
    lines.push(`}`);
    lines.push("");

    // Generar funciones helper para escribir selectores de errores
    for (const error of errors) {
      const signature = generateErrorSignature(error);
      const selector = toFunctionSelector(signature);
      const selectorBytes = hexToByteArray(selector);
      
      const fnName = `__write_error_selector_${error.name}`;
      lines.push(`// Error: ${error.name}`);
      lines.push(`// Selector: ${selector}`);
      lines.push(`// Signature: ${signature}`);
      lines.push(`export function ${fnName}(dst: usize): void {`);
      for (let i = 0; i < selectorBytes.length; i++) {
        lines.push(`  store<u8>(dst + ${i}, ${selectorBytes[i]});`);
      }
      lines.push(`}`);
      lines.push("");

      // Generar función helper para crear el error completo
      const errorDataFnName = `__create_error_data_${error.name}`;
      const totalSize = 4 + (error.fields.length * 32);
      
      lines.push(`export function ${errorDataFnName}(${error.fields.map((field, idx) => `arg${idx}: usize`).join(", ")}): usize {`);
      lines.push(`  const errorData: usize = malloc(${totalSize});`);
      lines.push(`  ${fnName}(errorData); // Write selector`);
      
      error.fields.forEach((field, idx) => {
        const offset = 4 + (idx * 32);
        lines.push(`  // Write argument ${idx + 1}: ${field.name} (${field.type})`);
        lines.push(`  U256.copy(errorData + ${offset}, arg${idx});`);
      });
      
      lines.push(`  return errorData;`);
      lines.push(`}`);
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

function mapTypeToAbi(type: string): string {
  switch (type) {
    case "U256": return "uint256";
    case "Address": return "address";
    case "boolean": return "bool";
    case "string": return "string";
    case "u64": return "uint64";
    default: return type;
  }
}

function hexToByteArray(hex: string): string[] {
  // Remover el "0x" si está presente
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes: string[] = [];
  
  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = cleanHex.substring(i, i + 2);
    bytes.push(`0x${byte}`);
  }
  
  return bytes;
} 