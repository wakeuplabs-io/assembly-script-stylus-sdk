import { EmitResult } from "@/cli/types/emit.types.js";
import { ArrayLiteral, IRExpression } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";
import { makeTemp } from "@/transformers/utils/temp-factory.js";

/**
 * Handler for array literal expressions ([a, b, c])
 * Transforms array literals to appropriate AssemblyScript array creation
 *
 * Handles:
 * - Empty arrays: []
 * - Element arrays: [a, b, c]
 * - Mixed type arrays with appropriate type coercion
 */
export class ArrayLiteralHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: IRExpression): boolean {
    return expr.kind === "array_literal";
  }

  /**
   * Processes array literal expressions
   */
  handle(expr: ArrayLiteral): EmitResult {
    const setupLines: string[] = [];

    const elementResults = expr.elements.map((element) =>
      this.contractContext.emitExpression(element),
    );

    elementResults.forEach((result) => {
      setupLines.push(...result.setupLines);
    });

    let elementSize = 32;

    if (expr.elements.length > 0) {
      const firstElementType = expr.elements[0].type;
      switch (firstElementType) {
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
    }

    let arrayCreationExpr: string;

    if (expr.elements.length === 0) {
      arrayCreationExpr = `Array.createMemory(${elementSize}, 0)`;
    } else {
      const tempVarName = makeTemp("array");
      const arrayLength = expr.elements.length;

      setupLines.push(
        `const ${tempVarName}: usize = ArrayStatic.createMemory(${elementSize}, ${arrayLength});`,
      );

      elementResults.forEach((result, index) => {
        setupLines.push(
          `ArrayStatic.set(${tempVarName}, ${index}, ${result.valueExpr}, ${elementSize});`,
        );
      });

      arrayCreationExpr = tempVarName;
    }

    return {
      setupLines,
      valueExpr: arrayCreationExpr,
      valueType: "usize",
    };
  }
}
