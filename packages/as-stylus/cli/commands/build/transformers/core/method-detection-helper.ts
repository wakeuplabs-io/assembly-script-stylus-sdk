import { METHOD_GROUPS, MethodName } from "@/cli/types/method-types.js";

/** Helper class for method detection and classification */
export class MethodDetectionHelper {
  /**
   * Checks if a method belongs to a specific group (COMPARISON, ARITHMETIC, etc.)
   */
  static isMethodInGroup(methodName: string, group: keyof typeof METHOD_GROUPS): boolean {
    const methodGroup = METHOD_GROUPS[group];
    if (!methodGroup) return false;

    // Handle both direct method names and dotted method calls
    const cleanMethodName = methodName.startsWith('.') ? methodName.slice(1) : methodName;
    const dottedMethodName = methodName.startsWith('.') ? methodName : `.${methodName}`;
    
    return methodGroup.some(method => 
      method === cleanMethodName || 
      dottedMethodName.endsWith(`.${method}`)
    );
  }

  /**
   * Checks if target matches any of the provided method patterns
   */
  static matchesMethodPattern(target: string, patterns: string[]): boolean {
    return patterns.some(pattern => target.endsWith(pattern));
  }

  /**
   * Detects comparison methods with dotted notation
   */
  static isComparisonMethod(target: string): boolean {
    const comparisonMethods = METHOD_GROUPS.COMPARISON.map(method => `.${method}`);
    return comparisonMethods.some(method => target.endsWith(method));
  }

  /**
   * Validates toString methods specific to a type
   */
  static isTypeSpecificToString(target: string, typeName: string): boolean {
    return target.endsWith(`.${MethodName.ToString}`) && target.startsWith(`${typeName}.`);
  }

  /**
   * Checks if target is a specific method with dotted notation
   */
  static isSpecificMethod(target: string, methodName: string): boolean {
    return target.endsWith(`.${methodName}`);
  }

  /**
   * Gets clean method name from dotted target (e.g., "token.balanceOf" -> "balanceOf")
   */
  static extractMethodName(target: string): string {
    const parts = target.split('.');
    return parts[parts.length - 1];
  }
}