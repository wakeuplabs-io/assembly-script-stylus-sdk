import { EmitResult } from "@/cli/types/emit.types.js";
import { Call } from "@/cli/types/ir.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for array method expressions (array.push(), array.pop(), array.length)
 * Transforms array method calls to appropriate AssemblyScript array operations
 *
 * Handles:
 * - array.push(element) - Add element to end of array
 * - array.pop() - Remove and return last element
 * - array.length - Get array length
 */
export class ArrayMethodHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   */
  canHandle(expr: Call): boolean {
    if (expr.kind !== "call") return false;

    const target = expr.target || "";
    const arrayMethods = ["push", "pop", "length"];

    if (!arrayMethods.includes(target)) return false;

    if (expr.receiver) {
      if (
        expr.receiver.type === "array" ||
        expr.receiver.type === "array_static" ||
        expr.receiver.type === "array_dynamic"
      ) {
        return true;
      }

      if (
        expr.receiver.kind === "var" &&
        "scope" in expr.receiver &&
        expr.receiver.scope === "storage"
      ) {
        return true;
      }

      if (expr.receiver.kind === "var") {
        const varName = expr.receiver.name;
        return varName.includes("Array") || varName.includes("array");
      }
    }

    return false;
  }

  /**
   * Processes array method expressions
   */
  handle(expr: Call): EmitResult {
    const target = expr.target || "";
    const setupLines: string[] = [];

    if (!expr.receiver) {
      return {
        setupLines: [],
        valueExpr: `/* Error: Array method ${target} without receiver */`,
        valueType: "void",
      };
    }

    const receiverResult = this.contractContext.emitExpression(expr.receiver);
    setupLines.push(...receiverResult.setupLines);

    const argResults = (expr.args || []).map((arg) => this.contractContext.emitExpression(arg));
    argResults.forEach((result) => setupLines.push(...result.setupLines));

    let methodExpr: string;
    let returnType: string;

    const isStorageArray = expr.receiver.kind === "var" && expr.receiver.scope === "storage";
    const isStaticArray = this.isStaticArray(expr.receiver);
    const elementType = this.getElementType(expr.receiver);
    const elementSize = this.getElementSize(elementType);

    switch (target) {
      case "push": {
        if (argResults.length !== 1) {
          return {
            setupLines,
            valueExpr: `/* Error: push() requires exactly one argument */`,
            valueType: "void",
          };
        }

        if (isStorageArray && !isStaticArray) {
          methodExpr = `ArrayDynamic.push(${receiverResult.valueExpr}, ${argResults[0].valueExpr})`;
        } else {
          methodExpr = `Array.push(${receiverResult.valueExpr}, ${argResults[0].valueExpr}, ${elementSize})`;
        }
        returnType = "void";
        break;
      }

      case "pop": {
        if (isStorageArray && !isStaticArray) {
          methodExpr = `ArrayDynamic.pop(${receiverResult.valueExpr})`;
          returnType = "usize";
        } else {
          methodExpr = `Array.pop(${receiverResult.valueExpr})`;
          returnType = "u32";
        }
        break;
      }

      case "length": {
        if (isStorageArray && isStaticArray) {
          const staticLength = this.getStaticArrayLength(expr.receiver);
          methodExpr = `ArrayStatic.getLengthAsU256(${staticLength})`;
          returnType = "usize";
        } else if (isStorageArray) {
          methodExpr = `ArrayDynamic.getLength(${receiverResult.valueExpr})`;
          returnType = "usize";
        } else {
          methodExpr = `Array.getLengthAsU256(${receiverResult.valueExpr})`;
          returnType = "usize";
        }
        break;
      }

      default:
        return {
          setupLines,
          valueExpr: `/* Error: Unsupported array method: ${target} */`,
          valueType: "void",
        };
    }

    return { setupLines, valueExpr: methodExpr, valueType: returnType };
  }

  /**
   * Determines if an array is static based on its IR information
   */
  private isStaticArray(receiver: any): boolean {
    if (receiver.kind === "var") {
      const varName = receiver.name;
      return varName.includes("static") || varName.includes("Static");
    }
    return false;
  }

  /**
   * Gets the compile-time length of a static array from the contract IR
   */
  private getStaticArrayLength(receiver: any): number {
    if (!receiver || receiver.kind !== "var") {
      throw new Error(
        `Static array length requires variable receiver, got ${receiver?.kind || "undefined"}`,
      );
    }

    const variableName = receiver.name;
    const variable = this.contractContext.getStorageVariable(variableName);

    if (!variable) {
      throw new Error(`Storage variable '${variableName}' not found in contract IR`);
    }

    if (variable.kind !== "array_static") {
      throw new Error(`Variable '${variableName}' is not a static array (kind: ${variable.kind})`);
    }

    // TypeScript narrowing: we know this is IRArrayStaticVar
    return variable.length;
  }

  /**
   * Gets the element type from the receiver's genericType or infers it from name
   */
  private getElementType(receiver: any): string {
    if (receiver.genericType) {
      return receiver.genericType;
    }

    if (receiver.kind === "var") {
      const varName = receiver.name;
      if (varName.includes("U256") || varName.includes("uint256")) return "U256";
      if (varName.includes("Address") || varName.includes("address")) return "Address";
      if (varName.includes("Bool") || varName.includes("bool")) return "Bool";
      if (varName.includes("String") || varName.includes("string")) return "String";
    }

    return "U256";
  }

  /**
   * Gets the element size in bytes for different types
   */
  private getElementSize(elementType: string): number {
    switch (elementType) {
      case "U256":
      case "I256":
        return 32;
      case "Address":
        return 20;
      case "Bool":
        return 1;
      case "String":
        return 32;
      default:
        return 32;
    }
  }
}
