import { ctx } from "@/cli/shared/compilation-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

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
  const objectType = getExpressionType(objectIR);
  if (!objectType) return { isStruct: false };

  const structName = extractStructName(objectType);

  if (ctx.structRegistry.has(structName) || (objectIR.kind === "var" && objectIR.type === AbiType.Struct)) {
    return { isStruct: true, structName };
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

export function isStructFieldAccess(objectExpr: any): { isStruct: boolean; structName?: string; variableName?: string } {
  console.log("isStructFieldAccess called with:", JSON.stringify(objectExpr, null, 2));
  console.log("Current variableTypes:", Array.from(ctx.variableTypes.entries()));
  console.log("Current structRegistry:", Array.from(ctx.structRegistry.keys()));

  if (objectExpr.kind === "var") {
    const variableName = objectExpr.name;
    console.log(`Simple var: ${variableName}`);

    const result = getStructInfoFromVariableName(variableName);
    if (result.isStruct) {
      console.log("Detected as struct!");
    }
    return result;
  }

  // If it's a nested member access (obj.prop.field)
  if (objectExpr.kind === "member") {
    // Recursively analyze: StructContract.myStruct -> myStruct must be a struct
    const memberName = objectExpr.property; // "myStruct" 
    const baseObject = objectExpr.object;   // StructContract o base

    console.log(`Member access: ${memberName}, base:`, baseObject);

    // Build the full variable name
    let fullVariableName = "";

    if (baseObject.kind === "var") {
      // Case: ClassName.structField
      const className = baseObject.name;
      fullVariableName = `${className}.${memberName}`;
      console.log(`Class.field pattern: ${className}.${memberName} -> ${fullVariableName}`);
    } else if (baseObject.kind === "member") {
      // More complex case: obj.prop.structField (recursive)
      // For now, we simplify: we assume it's ContractName.structField
      fullVariableName = `${ctx.contractName}.${memberName}`;
      console.log(`Nested member pattern: ${ctx.contractName}.${memberName} -> ${fullVariableName}`);
    } else {
      console.log("❌ Unknown base object kind:", baseObject.kind);
      return { isStruct: false };
    }

    // Check if the variable is of type struct
    const variableType = ctx.variableTypes.get(fullVariableName);

    console.log(`Member lookup: ${fullVariableName} -> type: ${variableType}`);

    if (variableType) {
      const structName = extractStructName(variableType);
      console.log(`Extracted struct name: ${structName}`);

      if (ctx.structRegistry.has(structName)) {
        console.log("Detected as struct!");
        return {
          isStruct: true,
          structName: structName,
          variableName: fullVariableName
        };
      }
    }
  }

  console.log("Not detected as struct");
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