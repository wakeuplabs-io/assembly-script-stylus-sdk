import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, IRStruct, Member } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

import { getStructInfoFromVariableName } from "../../../analyzers/struct/struct-utils.js";

export class StructFieldAccessHandler extends Handler {
  private structs: Map<string, IRStruct>;

  constructor(contractContext: ContractContext, structs: Map<string, IRStruct>) {
    super(contractContext);
    this.structs = structs;
  }

  canHandle(expr: IRExpression): boolean {
    return (
      expr.kind === "member" &&
      !!expr.object &&
      !!expr.property &&
      this.isStructAccess(expr)
    );
  }

  handle(expr: Member): EmitResult {
    const objectResult = this.contractContext.emit(expr.object);
    
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

  private isStructAccess(expr: Member): boolean {
    const structInfo = this.getStructInfo(expr.object);
    return structInfo.isStruct;
  }

  private getStructInfo(objectExpr: IRExpression): { isStruct: boolean; structName?: string; variableName?: string } {
    // If it's a simple identifier (variable)
    if (objectExpr.kind === "var") {
      const variableName = objectExpr.name;
      return getStructInfoFromVariableName(variableName);
    }
    
    // TODO: Handle more complex cases (obj.prop.field, etc.)
    
    return { isStruct: false };
  }
} 