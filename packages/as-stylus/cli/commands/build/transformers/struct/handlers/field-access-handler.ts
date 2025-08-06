import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression, IRStruct, Member } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

import { getStructInfoFromVariableName } from "../../../analyzers/struct/struct-utils.js";

export class StructFieldAccessHandler extends Handler {
  private structs: Map<string, IRStruct>;

  constructor(contractContext: ContractContext, structs: Map<string, IRStruct>) {
    super(contractContext);
    this.structs = structs;
  }

  canHandle(expr: Call | Member): boolean {
    return (
      expr.kind === "member" &&
      !!expr.object &&
      !!expr.property &&
      this.isStructAccess(expr)
    );
  }

  handle(expr: Member): EmitResult {
    const objectResult = this.contractContext.emitExpression(expr.object);
    
    const structInfo = this.getStructInfo(expr.object);

    if (!structInfo.isStruct || !structInfo.structName) {
      return {
        setupLines: [...objectResult.setupLines],
        valueExpr: `/* Not a struct access: ${expr.property} */`,
        valueType: "usize",
      };
    }

    const struct = this.structs.get(structInfo.structName);
    if (!struct) {
      return {
        setupLines: [...objectResult.setupLines],
        valueExpr: `/* Unknown struct type: ${structInfo.structName} */`,
        valueType: "usize",
      };
    }

    const field = struct.fields.find((f) => f.name === expr.property);
    if (!field) {
      return {
        setupLines: [...objectResult.setupLines],
        valueExpr: `/* Unknown field: ${expr.property} */`,
        valueType: "usize",
      };
    }

    const isStorageAccess = this.isStorageAccess(expr.object);
    const getterPrefix = isStorageAccess
      ? `${structInfo.structName}_get_`
      : `${structInfo.structName}_memory_get_`;
    const fieldAccess = `${getterPrefix}${field.name}(${objectResult.valueExpr})`;

    return {
      setupLines: [...objectResult.setupLines],
      valueExpr: fieldAccess,
      valueType: field.dynamic ? "usize" : field.type,
    };
  }

  private isStructAccess(expr: Member): boolean {
    const structInfo = this.getStructInfo(expr.object);
    return structInfo.isStruct;
  }

  private isStorageAccess(objectExpr: IRExpression): boolean {
    if (objectExpr && (objectExpr as { scope?: string }).scope === "storage") {
      return true;
    }
    return false;
  }

  private getStructInfo(objectExpr: IRExpression): {
    isStruct: boolean;
    structName?: string;
    variableName?: string;
  } {
    if (objectExpr.kind === "var") {
      const variableName = objectExpr.name;

      const storageInfo = getStructInfoFromVariableName(variableName);
      if (storageInfo.isStruct) {
        return storageInfo;
      }

      if (objectExpr.type === "struct") {
        const structNames = Array.from(this.structs.keys());
        if (structNames.length > 0) {
          return {
            isStruct: true,
            structName: structNames[0],
            variableName,
          };
        }
      }
    }

    return { isStruct: false };
  }
}
