import { AbiType } from "../../../../../types/abi.types.js";
import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { IRStruct } from "../../../../../types/ir.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class StructFactoryCreateHandler implements ExpressionHandler {
  private structs: Map<string, IRStruct>;

  constructor(structs: Map<string, IRStruct>) {
    this.structs = structs;
  }

  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" && 
      expr.target === "StructFactory.create" &&
      expr.metadata?.isStructCreation === true
    );
  }

  handle(
    expr: any,
    ctx: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const structType = expr.metadata?.structType;
    
    if (!structType) {
      return {
        setupLines: [],
        valueExpr: `/* Missing struct type in StructFactory.create */`,
        valueType: "usize"
      };
    }

    const struct = this.structs.get(structType);
    if (!struct) {
      return {
        setupLines: [],
        valueExpr: `/* Unknown struct type: ${structType} */`,
        valueType: "usize"
      };
    }

    const structPtr = makeTemp("structPtr");
    const setup = [
      `// Allocate memory for ${structType} with extra space for string data`,
      `const ${structPtr}: usize = ${structType}_alloc();`
    ];

    const initialValues = expr.args || [];
    
    // Process all fields except strings first
    for (let i = 0; i < Math.min(initialValues.length, struct.fields.length); i++) {
      const field = struct.fields[i];
      const valueArg = initialValues[i];
      
      // Skip string fields - we'll handle them specially for ABI encoding
      if (field.type === AbiType.String || field.type === "Str") {
        continue;
      }
      
      const valueResult = emit(valueArg, ctx);
      setup.push(...valueResult.setupLines);
      setup.push(`${structType}_memory_set_${field.name}(${structPtr}, ${valueResult.valueExpr});`);
    }

    // Check if this struct has dynamic strings and handle ABI encoding
    const hasStrings = struct.fields.some(field => field.type === AbiType.String || field.type === "Str");
    if (hasStrings && struct.dynamic) {
      // Find the string field and its value
      const stringFieldIndex = struct.fields.findIndex(field => field.type === AbiType.String || field.type === "Str");
      if (stringFieldIndex !== -1 && stringFieldIndex < initialValues.length) {
        const stringField = struct.fields[stringFieldIndex];
        
        setup.push(``);
        setup.push(`// Now encode the struct for ABI return with proper string layout`);
        setup.push(`// We need to get the actual string object from storage first`);
        setup.push(`const stringObjFromStorage = Struct.getString(__SLOT01);`);
        setup.push(``);
        setup.push(`// Use the new ABI encoding function to properly layout the struct`);
        setup.push(`Struct.encodeStructForABI(${structPtr}, ${stringField.offset}, stringObjFromStorage);`);
      }
    } else {
      // For non-dynamic structs, set string fields normally
      for (let i = 0; i < Math.min(initialValues.length, struct.fields.length); i++) {
        const field = struct.fields[i];
        const valueArg = initialValues[i];
        
        if (field.type === AbiType.String || field.type === "Str") {
          const valueResult = emit(valueArg, ctx);
          setup.push(...valueResult.setupLines);
          setup.push(`${structType}_memory_set_${field.name}(${structPtr}, ${valueResult.valueExpr});`);
        }
      }
    }

    return {
      setupLines: setup,
      valueExpr: structPtr,
      valueType: structType
    };
  }
} 