import { IRExpression, Call } from "@/cli/types/ir.types.js";

/** Helper class for type exclusion logic centralized across transformers */
export class TypeExclusionHelper {
  /** Common prefixes that should be excluded from numeric type transformers */
  private static readonly EXCLUDED_PREFIXES = [
    "Address.", 
    "boolean.", 
    "address.", 
    "string.", 
    "str."
  ];

  /**
   * Checks if a target should be excluded from transformation
   * based on type-specific prefixes
   */
  static shouldExcludeTarget(target: string): boolean {
    return this.EXCLUDED_PREFIXES.some(prefix => target.startsWith(prefix));
  }

  /**
   * Checks if an expression represents an internal operation
   * that should be excluded from transformation
   */
  static isInternalExpression(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const call = expr as Call;
    const target = call.target || "";
    return (call as any).originalType || 
           target.includes("_get_") || 
           target.includes("_set_");
  }

  /**
   * Comprehensive check combining internal expression and target exclusion
   */
  static shouldExcludeExpression(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const call = expr as Call;
    const target = call.target || "";
    return this.isInternalExpression(expr) || this.shouldExcludeTarget(target);
  }

  /**
   * Checks if target belongs to Address type operations
   * (Used specifically for preventing U256/I256 from intercepting Address.equals)
   */
  static isAddressOperation(target: string): boolean {
    return target.startsWith("Address.");
  }

  /**
   * Adds custom exclusion check for specific types
   */
  static shouldExcludeForType(target: string, excludedTypes: string[]): boolean {
    return excludedTypes.some(type => target.startsWith(`${type}.`));
  }
}