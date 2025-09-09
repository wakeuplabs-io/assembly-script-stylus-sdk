import { EmitResult } from "@/cli/types/emit.types.js";
import { ArrayAssignment } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for array assignment expressions (array[index] = value)
 * Transforms array element assignments to appropriate AssemblyScript array operations
 *
 * Handles:
 * - Storage arrays: staticArray[index] = value → ArrayStatic.set()
 * - Dynamic arrays: dynamicArray[index] = value → ArrayDynamic.set()
 * - Memory arrays: memoryArray[index] = value → Array.set()
 */
export class ArrayAssignmentHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: any): boolean {
    return expr.kind === "array_assignment";
  }

  /**
   * Processes array assignment expressions
   */
  handle(expr: ArrayAssignment): EmitResult {
    const arrayResult = this.contractContext.emitExpression(expr.array);
    const indexResult = this.contractContext.emitExpression(expr.index);
    const valueResult = this.contractContext.emitExpression(expr.value);

    const setupLines = [
      ...arrayResult.setupLines,
      ...indexResult.setupLines,
      ...valueResult.setupLines,
    ];

    let indexExpr = indexResult.valueExpr;
    if (expr.index.type === "uint256") {
      indexExpr = `<u32>${indexResult.valueExpr}`;
    }

    let assignmentExpr: string;

    let elementSize: number;
    switch (expr.type) {
      case "uint256":
      case "int256":
        elementSize = 32;
        break;
      case "address":
        elementSize = 20;
        break;
      case "bool":
        elementSize = 1;
        break;
      default:
        elementSize = 32;
    }

    if (expr.array.kind === "var" && "scope" in expr.array && expr.array.scope === "storage") {
      const isStatic = this.isStaticArray(expr.array);

      if (isStatic) {
        assignmentExpr = `ArrayStatic.set(${arrayResult.valueExpr}, ${indexExpr}, ${valueResult.valueExpr}, ${elementSize})`;
      } else {
        assignmentExpr = `ArrayDynamic.set(${arrayResult.valueExpr}, ${indexExpr}, ${valueResult.valueExpr})`;
      }
    } else {
      assignmentExpr = `Array.set(${arrayResult.valueExpr}, ${indexExpr}, ${valueResult.valueExpr}, ${elementSize})`;
    }

    return {
      setupLines,
      valueExpr: assignmentExpr,
      valueType: "void",
    };
  }

  /**
   * Determines if an array variable is static based on its type information
   * @param arrayVar - The array variable IR node
   * @returns true if the array is static, false if dynamic
   */
  private isStaticArray(arrayVar: any): boolean {
    if (arrayVar.type === "array_static") {
      return true;
    }
    if (arrayVar.type === "array_dynamic") {
      return false;
    }

    if (arrayVar.kind === "var") {
      const varName = arrayVar.name;

      if (varName.includes("static") || varName.includes("Static")) {
        return true;
      }

      if (varName.includes("dynamic") || varName.includes("Dynamic")) {
        return false;
      }
    }

    return false;
  }
}
