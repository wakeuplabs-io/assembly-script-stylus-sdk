import { EmitResult } from "@/cli/types/emit.types.js";
import { Handler } from "@/transformers/core/base-abstract-handlers.js";

/**
 * Handler for U256 chained call expressions like U256Factory.fromString("2").add(counter)
 * Handles expressions where a method is called on the result of another expression
 */
export class U256ChainedCallHandler extends Handler {
  /**
   * Determines if this handler can process the given expression
   * Modern receiver-based chained calls only
   */
  canHandle(expr: any): boolean {
    if (expr.kind !== "call") return false;

    // Handle receiver-based chained calls (modern approach)
    if (expr.receiver && expr.receiver.kind === "call") {
      const target = expr.target || "";
      const receiverTarget = expr.receiver.target || "";
      const receiverReceiver = expr.receiver.receiver;

      // SPECIFIC CASE: U256Factory.fromString().add() pattern
      if (
        receiverTarget === "fromString" &&
        receiverReceiver &&
        receiverReceiver.kind === "var" &&
        receiverReceiver.name === "U256Factory"
      ) {
        const u256Methods = [
          "add",
          "sub",
          "mul",
          "div",
          "mod",
          "pow",
          "lessThan",
          "greaterThan",
          "equals",
        ];
        return u256Methods.includes(target);
      }

      // Other U256 chained operations (e.g., result.mul().div())
      if (expr.receiver.returnType === "uint256" || expr.receiver.type === "uint256") {
        const u256Methods = [
          "add",
          "sub",
          "mul",
          "div",
          "mod",
          "pow",
          "lessThan",
          "greaterThan",
          "equals",
        ];
        console.log(`>>> U256ChainedCallHandler DETECTED U256 chain: receiver.${target}()`);
        return u256Methods.includes(target);
      }
    }

    return false;
  }

  /**
   * Processes U256 chained call expressions
   * Modern receiver-based approach only
   */
  handle(expr: any): EmitResult {
    const target = expr.target || "";
    const setupLines: string[] = [];

    const argResults = (expr.args || []).map((arg: any) =>
      this.contractContext.emitExpression(arg),
    );
    setupLines.push(...argResults.flatMap((result: any) => result.setupLines));
    const argExprs = argResults.map((result: any) => result.valueExpr);

    if (expr.receiver && expr.receiver.kind === "call") {
      const receiverResult = this.contractContext.emitExpression(expr.receiver);
      setupLines.unshift(...receiverResult.setupLines);

      const allArgs = [receiverResult.valueExpr, ...argExprs].join(", ");

      const valueType = this.getValueType(target);

      return {
        setupLines,
        valueExpr: `U256.${target}(${allArgs})`,
        valueType,
      };
    }

    return {
      setupLines,
      valueExpr: `/* Error: Unsupported chained call pattern: ${target} */`,
      valueType: "U256",
    };
  }

  private getValueType(methodName: string): string {
    const comparisonMethods = [
      "lessThan",
      "greaterThan",
      "equals",
      "lessThanOrEqual",
      "greaterThanOrEqual",
      "notEqual",
    ];
    if (comparisonMethods.includes(methodName)) {
      return "bool";
    }
    return "U256";
  }
}
