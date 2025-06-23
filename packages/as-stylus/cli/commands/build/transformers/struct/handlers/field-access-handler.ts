import { ctx } from "../../../../../shared/compilation-context.js";
import { EmitContext, EmitResult } from "../../../../../types/emit.types.js";
import { IRStruct } from "../../../../../types/ir.types.js";
import { ExpressionHandler } from "../../core/interfaces.js";

export class StructFieldAccessHandler implements ExpressionHandler {
  private structs: Map<string, IRStruct>;

  constructor(structs: Map<string, IRStruct>) {
    this.structs = structs;
  }

  canHandle(expr: any): boolean {
    return (
      expr.kind === "member" &&
      expr.object &&
      expr.property &&
      this.isStructAccess(expr)
    );
  }

  handle(
    expr: any,
    context: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const objectResult = emit(expr.object, context);
    
    const structInfo = this.getStructInfo(expr.object);
    
    if (!structInfo.isStruct || !structInfo.structName) {
      return {
        setupLines: [...objectResult.setupLines],
        valueExpr: `/* Not a struct access: ${expr.property} */`,
        valueType: "usize"
      };
    }

    const struct = this.structs.get(structInfo.structName);
    if (!struct) {
      return {
        setupLines: [...objectResult.setupLines],
        valueExpr: `/* Unknown struct type: ${structInfo.structName} */`,
        valueType: "usize"
      };
    }

    const field = struct.fields.find(f => f.name === expr.property);
    if (!field) {
      return {
        setupLines: [...objectResult.setupLines],
        valueExpr: `/* Unknown field: ${expr.property} */`,
        valueType: "usize"
      };
    }

    const fieldAccess = `${structInfo.structName}_get_${field.name}(${objectResult.valueExpr})`;
    
    return {
      setupLines: [...objectResult.setupLines],
      valueExpr: fieldAccess,
      valueType: field.dynamic ? "usize" : field.type
    };
  }

  private isStructAccess(expr: any): boolean {
    const structInfo = this.getStructInfo(expr.object);
    return structInfo.isStruct;
  }

  private getStructInfo(objectExpr: any): { isStruct: boolean; structName?: string; variableName?: string } {
    // If it's a simple identifier (variable)
    if (objectExpr.kind === "var") {
      const variableName = objectExpr.name;
      
      // Search in contract storage variables
      const fullVariableName = `${ctx.contractName}.${variableName}`;
      const variableType = ctx.variableTypes.get(fullVariableName);
      
      if (variableType && ctx.structRegistry.has(variableType)) {
        return {
          isStruct: true,
          structName: variableType,
          variableName: fullVariableName
        };
      }
      
      // Also check if the type is directly a struct
      if (ctx.structRegistry.has(variableName)) {
        return {
          isStruct: true,
          structName: variableName,
          variableName: variableName
        };
      }
    }
    
    // TODO: Handle more complex cases (obj.prop.field, etc.)
    
    return { isStruct: false };
  }
} 