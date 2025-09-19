import { toFunctionSelector } from "viem";

import { IRContract, IRErrorDecl, IRExpression } from "@/cli/types/ir.types.js";

import { convertType } from "../../builder/build-abi.js";
import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
import { ErrorRevertHandler } from "./handlers/revert-handler.js";

export class ErrorTransformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext, errors: IRErrorDecl[]) {
    super(contractContext, "Error");
    this.registerHandler(new ErrorRevertHandler(contractContext, errors));
  }

  canHandle(expr: IRExpression): boolean {
    if (!expr || expr.kind !== "call") return false;
    const target = expr.target || "";
    return target.endsWith(".revert");
  }

  protected handleDefault() {
    return {
      setupLines: [],
      valueExpr: "/* unsupported error operation */",
    };
  }
}

export function generateErrorSignature(error: IRErrorDecl): string {
  const signature = `${error.name}(${error.fields.map((f) => mapTypeToAbi(f.type)).join(",")})`;
  return signature;
}

export function registerErrorTransformer(contract: IRContract): string[] {
  const lines: string[] = [];

  if (contract.errors && contract.errors.length > 0) {
    const errors = contract.errors;

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

      const errorDataFnName = `__create_error_data_${error.name}`;
      const totalSize = 4 + error.fields.length * 32;

      lines.push(
        `export function ${errorDataFnName}(${error.fields.map((field, idx) => `arg${idx}: usize`).join(", ")}): usize {`,
      );
      lines.push(`  const errorData: usize = malloc(${totalSize});`);
      lines.push(`  ${fnName}(errorData); // Write selector`);

      error.fields.forEach((field, idx) => {
        const offset = 4 + idx * 32;
        lines.push(`  // Write argument ${idx + 1}: ${field.name} (${field.type})`);
        lines.push(`  U256.copyInPlace(errorData + ${offset}, arg${idx});`);
      });

      lines.push(`  return errorData;`);
      lines.push(`}`);
      lines.push("");
    }
  }

  return lines;
}

export function generateErrorABI(contract: IRContract): any[] {
  const errorABI = [];

  if (contract.errors && contract.errors.length > 0) {
    for (const error of contract.errors) {
      errorABI.push({
        type: "error",
        name: error.name,
        inputs: error.fields.map((field) => ({
          name: field.name,
          type: convertType(contract.symbolTable, field.type),
          internalType: convertType(contract.symbolTable, field.type),
        })),
      });
    }
  }

  return errorABI;
}

function mapTypeToAbi(type: string): string {
  switch (type) {
    case "U256":
      return "uint256";
    case "Address":
      return "address";
    case "boolean":
      return "bool";
    case "string":
      return "string";
    case "u64":
      return "uint64";
    default:
      return type;
  }
}

function hexToByteArray(hex: string): string[] {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes: string[] = [];

  for (let i = 0; i < cleanHex.length; i += 2) {
    const byte = cleanHex.substring(i, i + 2);
    bytes.push(`0x${byte}`);
  }

  return bytes;
}
