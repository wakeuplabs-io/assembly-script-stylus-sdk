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

    const isStorageArray =
      expr.array.kind === "var" && "scope" in expr.array && expr.array.scope === "storage";
    const isStaticArray = isStorageArray && this.isStaticArray(expr.array);
    const isDynamicArray = isStorageArray && !isStaticArray;

    let indexExpr = indexResult.valueExpr;
    let indexConversionLine = "";

    if (expr.index.type === "uint256") {
      if (isStaticArray) {
        const varName = `__index_${Math.floor(Math.random() * 10000)}`;
        indexConversionLine = `const ${varName}: u32 = (load<u8>(${indexResult.valueExpr} + 28) << 24) | (load<u8>(${indexResult.valueExpr} + 29) << 16) | (load<u8>(${indexResult.valueExpr} + 30) << 8) | load<u8>(${indexResult.valueExpr} + 31);`;
        indexExpr = varName;
      } else if (isDynamicArray) {
        indexExpr = indexResult.valueExpr;
      } else {
        indexExpr = `<u32>${indexResult.valueExpr}`;
      }
    }

    let accessExpr: string;
    let elementType: string;

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

    if (isStaticArray) {
      accessExpr = `ArrayStatic.get(${arrayResult.valueExpr}, ${indexExpr}, ${elementSize})`;
    } else if (isDynamicArray) {
      accessExpr = `ArrayDynamic.get(${arrayResult.valueExpr}, ${indexExpr})`;
    } else {
      accessExpr = `Array.get(${arrayResult.valueExpr}, ${indexExpr}, ${elementSize})`;
    }

    const finalSetupLines = [...setupLines];
    if (indexConversionLine) {
      finalSetupLines.push(indexConversionLine);
    }

    return {
      setupLines: finalSetupLines,
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
