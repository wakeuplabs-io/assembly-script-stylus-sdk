import { EmitResult } from "@/cli/types/emit.types.js";
import { ArrayAccess, IRExpression } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for array access expressions (array[index])
 * Transforms array element access to appropriate AssemblyScript array operations
 *
 * Handles:
 * - Storage arrays: staticArray[index], dynamicArray[index]
 * - Memory arrays: memoryArray[index]
 * - Calldata arrays: calldataArray[index]
 */
export class ArrayAccessHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "array_access";
  }

  /**
   * Processes array access expressions
   */
  handle(expr: ArrayAccess): EmitResult {
    const arrayResult = this.contractContext.emitExpression(expr.array);
    const indexResult = this.contractContext.emitExpression(expr.index);

    const setupLines = [...arrayResult.setupLines, ...indexResult.setupLines];

    // Convert index to u32 automatically if it's U256
    let indexExpr = indexResult.valueExpr;
    if (expr.index.type === "uint256") {
      indexExpr = `<u32>${indexResult.valueExpr}`;
    }

    // Determine the array type and generate appropriate access code
    let accessExpr: string;
    let elementType: string;

    // Determine element size based on the result type
    let elementSize: number;
    switch (expr.type) {
      case "uint256":
      case "int256":
        elementSize = 32;
        elementType = "usize";
        break;
      case "address":
        elementSize = 20;
        elementType = "usize";
        break;
      case "bool":
        elementSize = 1;
        elementType = "bool";
        break;
      default:
        elementSize = 32;
        elementType = "usize";
    }

    // Check if this is a storage array access
    if (expr.array.kind === "var" && "scope" in expr.array && expr.array.scope === "storage") {
      // Determine if it's static or dynamic array based on the variable type
      const isStatic = this.isStaticArray(expr.array);

      if (isStatic) {
        // Static storage array: ArrayStatic.get(array, index, elementSize)
        accessExpr = `ArrayStatic.get(${arrayResult.valueExpr}, ${indexExpr}, ${elementSize})`;
      } else {
        // Dynamic storage array: ArrayDynamic.get(array, index)
        accessExpr = `ArrayDynamic.get(${arrayResult.valueExpr}, ${indexExpr})`;
      }
    } else {
      // Memory or calldata array: Array.get(array, index, elementSize)
      accessExpr = `Array.get(${arrayResult.valueExpr}, ${indexExpr}, ${elementSize})`;
    }

    return {
      setupLines,
      valueExpr: accessExpr,
      valueType: elementType,
    };
  }

  /**
   * Determines if an array variable is static based on its type information
   * @param arrayVar - The array variable IR node
   * @returns true if the array is static, false if dynamic
   */
  private isStaticArray(arrayVar: IRExpression): boolean {
    // In a complete implementation, this would check the symbol table
    // to determine if the variable is declared as a static array (e.g., U256[3])
    // For now, we'll use a heuristic based on variable naming or type

    if (arrayVar.kind === "var") {
      const varName = arrayVar.name;

      // Check if the variable name suggests it's static
      if (varName.includes("static") || varName.includes("Static")) {
        return true;
      }

      // Check if the variable name suggests it's dynamic
      if (varName.includes("dynamic") || varName.includes("Dynamic")) {
        return false;
      }
    }

    // Default to dynamic for safety
    return false;
  }
}
