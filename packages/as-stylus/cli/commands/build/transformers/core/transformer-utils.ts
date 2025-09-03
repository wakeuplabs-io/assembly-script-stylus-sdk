import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, Call } from "@/cli/types/ir.types.js";
import { MethodName } from "@/cli/types/method-types.js";

/** Utility class for common transformer validation and detection logic */
export class TransformerUtils {
  /**
   * Checks if an expression should be excluded from transformation
   * based on internal patterns (_get_, _set_) or originalType flag
   */
  static isExcludedExpression(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const call = expr as Call;
    const target = call.target || "";
    return (call as any).originalType || target.includes("_get_") || target.includes("_set_");
  }

  /**
   * Detects if an expression is a factory method call for a specific factory
   */
  static isFactoryMethod(expr: IRExpression, factoryName: string): boolean {
    if (expr.kind !== "call") return false;
    const call = expr as Call;
    const target = call.target || "";
    
    // Direct factory calls like "U256Factory.create"
    if (target === `${factoryName}.create` || target === `${factoryName}.fromString`) {
      return true;
    }

    // Method calls on factory receiver like U256Factory.create()
    if ((target === MethodName.Create || target === MethodName.FromString) && call.receiver) {
      if (call.receiver.kind === "var" && call.receiver.name === factoryName) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validates if expression has valid return type and passes exclusion checks
   */
  static isValidReturnType(expr: IRExpression, expectedType: AbiType): boolean {
    if (!('returnType' in expr) || expr.returnType !== expectedType) {
      return false;
    }
    
    return !this.isExcludedExpression(expr);
  }

  /**
   * Checks if target should be excluded from specific type transformers
   */
  static shouldExcludeFromType(target: string, excludedTypes: string[]): boolean {
    return excludedTypes.some(type => target.startsWith(`${type}.`));
  }

  /**
   * Detects static method calls for a specific type (e.g., "U256.copy")
   */
  static isStaticTypeMethod(target: string, typeName: string, methodName: string): boolean {
    return target === `${typeName}.${methodName}`;
  }

  /**
   * Safe check for call expressions only
   */
  static isCallExpression(expr: IRExpression): expr is Call {
    return expr.kind === "call";
  }
}