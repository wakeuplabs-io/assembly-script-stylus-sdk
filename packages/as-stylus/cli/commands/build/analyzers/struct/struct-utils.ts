import { ctx } from "@/cli/shared/compilation-context.js";

/**
 * Extracts the struct name from a full type
 * Example: "import(...).StructTest" -> "StructTest"
 */
function extractStructName(fullType: string): string {
  // If it's an import path, extract only the final name
  if (fullType.includes(").")) {
    const parts = fullType.split(").");
    return parts[parts.length - 1];
  }
  
  // If it's just the name, return it as is
  return fullType;
}

export function isStructVariable(variableName: string): boolean {
  const variableType = ctx.variableTypes.get(variableName);
  if (!variableType) return false;
  
  const structName = extractStructName(variableType);
  return ctx.structRegistry.has(structName);
}

export function isStructType(typeName: string): boolean {
  const structName = extractStructName(typeName);
  return ctx.structRegistry.has(structName);
}


export function getStructDefinition(structName: string) {
  const cleanName = extractStructName(structName);
  return ctx.structRegistry.get(cleanName);
}

export function isStructFieldAccess(objectExpr: any): { isStruct: boolean; structName?: string; variableName?: string } {
  console.log("isStructFieldAccess called with:", JSON.stringify(objectExpr, null, 2));
  console.log("Current variableTypes:", Array.from(ctx.variableTypes.entries()));
  console.log("Current structRegistry:", Array.from(ctx.structRegistry.keys()));
  
  if (objectExpr.kind === "var") {
    const variableName = objectExpr.name;
    
    const fullVariableName = `${ctx.contractName}.${variableName}`;
    const variableType = ctx.variableTypes.get(fullVariableName);
    
    console.log(`Simple var: ${variableName} -> ${fullVariableName} -> type: ${variableType}`);
    
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
    
    // TODO: Search in current method variables
    // For now, we only check storage variables
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