import { ctx } from "@/cli/shared/compilation-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { convertType } from "../../builder/build-abi.js";

/**
 * Extracts the struct name from a full type
 * Example: "import(...).StructTest" -> "StructTest"
 */
export function extractStructName(fullType: string): string {
  // If it's an import path, extract only the final name
  if (fullType.includes(").")) {
    const parts = fullType.split(").");
    return parts[parts.length - 1];
  }
  
  // If it's just the name, return it as is
  return fullType;
}

/**
 * Converts basic types to AbiType. Returns null if not a basic type.
 * This is shared logic between different type conversion functions.
 */
export function convertBasicType(typeString: string): AbiType | null {
  if (Object.values(AbiType).includes(typeString as AbiType)) {
    return typeString as AbiType;
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
    default:
      return null;
  }
}

/**
 * Converts a type string to appropriate IR format, preserving struct information
 * This is shared between MethodIRBuilder and ArgumentIRBuilder
 */
export function convertTypeForIR(typeString: string): { type: AbiType; originalType?: string } {
  // Try to convert as basic type first
  const basicType = convertBasicType(typeString);
  if (basicType) {
    return { type: basicType };
  }
  const structName = extractStructName(typeString);
  if (ctx.structRegistry.has(structName)) {
    return { 
      type: AbiType.Struct, 
      originalType: typeString 
    };
  }
  // Fallback
  return { type: convertType(typeString) };
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
 * Checks if an IR expression is of struct type
 */
export function isExpressionOfStructType(objectIR: IRExpression): { isStruct: boolean; structName?: string } {
  if ((objectIR.kind === "var" || objectIR.kind === "call" || objectIR.kind === "member") && 
      objectIR.originalType && ctx.structRegistry.has(objectIR.originalType)) {
    return { isStruct: true, structName: objectIR.originalType };
  }

  if (objectIR.kind === "var") {
    const fullVariableName = `${ctx.contractName}.${objectIR.name}`;
    const contextType = ctx.variableTypes.get(fullVariableName);
    
    if (contextType && ctx.structRegistry.has(contextType)) {
      return { isStruct: true, structName: contextType };
    }
  }

  const objectType = getExpressionType(objectIR);
  if (!objectType) return { isStruct: false };

  if (objectType === "struct" && objectIR.kind === "var") {
    const fullVariableName = `${ctx.contractName}.${objectIR.name}`;
    const actualType = ctx.variableTypes.get(fullVariableName);
    
    if (actualType && ctx.structRegistry.has(actualType)) {
      return { isStruct: true, structName: actualType };
    }
    
    return { isStruct: false };
  }

  if (ctx.structRegistry.has(objectType)) {
    return { isStruct: true, structName: objectType };
  }

  const extractedStructName = extractStructName(objectType);
  if (extractedStructName && ctx.structRegistry.has(extractedStructName)) {
    return { isStruct: true, structName: extractedStructName };
  }

  return { isStruct: false };
}

/**
 * Checks if a variable name corresponds to a struct variable
 * Used for checking object expressions in field access
 */
export function getStructInfoFromVariableName(variableName: string): { isStruct: boolean; structName?: string; variableName?: string } {
  // Search in contract storage variables
  const fullVariableName = `${ctx.contractName}.${variableName}`;
  const variableType = ctx.variableTypes.get(fullVariableName);

  if (variableType) {
  const structName = extractStructName(variableType);
    if (ctx.structRegistry.has(structName)) {
      return {
        isStruct: true,
        structName: structName,
        variableName: fullVariableName
      };
    }
  }

  // Also check if the type is directly a struct
  if (ctx.structRegistry.has(variableName)) {
    return {
      isStruct: true,
      structName: variableName,
      variableName: variableName
    };
  }

  return { isStruct: false };
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
 * Gets the type of a specific field in a struct
 */
export function getStructFieldType(structName: string, fieldName: string): AbiType | undefined {
  const struct = ctx.structRegistry.get(structName);
  if (!struct) return undefined;
  
  const field = struct.fields.find(f => f.name === fieldName);
  // TODO: check if this is correct
  return field?.type as AbiType | undefined;
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