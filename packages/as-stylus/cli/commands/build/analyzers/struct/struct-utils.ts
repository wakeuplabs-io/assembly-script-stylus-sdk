import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { convertType } from "../../builder/build-abi.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

function parseImport(fullType: string): string {
  if (fullType.startsWith("import(") && fullType.includes(").")) {
    const parts = fullType.split(").");
    return parts[parts.length - 1];
  }

  return fullType;
}
/**
 * Extracts the struct name from a full type
 * Example: "import(...).StructTest" -> "StructTest"
 */
export function extractStructName(fullType: string): string | null {
  return parseImport(fullType);
}

/**
 * Converts basic types to AbiType. Returns null if not a basic type.
 * This is shared logic between different type conversion functions.
 */
export function convertBasicType(input: string): AbiType | null {
  const typeString = parseImport(input);
  if (Object.values(AbiType).includes(typeString as AbiType)) {
    return typeString as AbiType;
  }

  if (typeString.startsWith("MappingNested")) {
    return AbiType.MappingNested;
  }

  if (typeString.startsWith("Mapping")) {
    return AbiType.Mapping;
  }

  switch (typeString.toLowerCase()) {
    case "u256":
      return AbiType.Uint256;
    case "i256":
      return AbiType.Int256;
    case "bool":
    case "boolean":
      return AbiType.Bool;
    case "str":
    case "string":
      return AbiType.String;
    case "address":
      return AbiType.Address;
    case "bytes32":
      return AbiType.Bytes32;
    case "bytes":
      return AbiType.Bytes;
    default:
      return null;
  }
}

/**
 * Converts a type string to appropriate IR format, preserving struct information
 * This is shared between MethodIRBuilder and ArgumentIRBuilder
 */
export function convertTypeForIR(symbolTable: SymbolTableStack, typeString: string): { type: AbiType; originalType?: string } {
  const basicType = convertBasicType(typeString);
  if (basicType) {
    return { type: basicType, originalType: typeString };
  }

  const structName = extractStructName(typeString);
  if (structName) {
    const variable = symbolTable.lookup(structName);
    if (variable?.type === AbiType.Struct) {
      return { 
        type: AbiType.Struct, 
        originalType: typeString 
      };
    }
  }

  return { type: convertType(symbolTable, typeString), originalType: typeString };
}

/**
 * Gets the type of an IR expression
 */
export function getExpressionType(expr: IRExpression): string | undefined {
  switch (expr.kind) {
    case "var":
      return expr.type;
    case "member":
      return expr.type;
    case "call":
      return expr.returnType;
    default:
      return undefined;
  }
}



/**
 * Determines if a type is primitive according to the golden rule:
 * Primitives (pass by value): U256, boolean, Address, numbers
 * Non-primitives (pass by reference): string, Str, structs
 */
export function isPrimitiveType(type: AbiType): boolean {
  const primitiveTypes = [AbiType.Uint256, AbiType.Bool, AbiType.Address];
  return primitiveTypes.includes(type);
}

/**
 * Extracts struct type from StructFactory.create<StructType>() call expression
 * This is used by CallFunctionIRBuilder to determine the return type
 */
export function extractStructTypeFromCall(callExpression: any): string | undefined {
  // This will be called from CallFunctionIRBuilder
  // For now, we'll use a simple heuristic or context analysis
  // The proper implementation would need access to TypeScript's type checker
  
  // If we have type arguments, extract from there
  if (callExpression.getTypeArguments && callExpression.getTypeArguments().length > 0) {
    const typeArg = callExpression.getTypeArguments()[0];
    return typeArg.getText();
  }
  
  // Fallback: try to infer from context or return undefined
  // This will need to be enhanced based on actual usage
  return undefined;
}

export function isStructPropertyAccess(target: string): boolean {
  const count = (target.match(/./g) || []).length;
  return target.startsWith("this.") && count === 3;
}