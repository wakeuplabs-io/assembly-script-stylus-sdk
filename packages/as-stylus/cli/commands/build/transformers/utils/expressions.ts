import { EmitResult, EmitContext } from "../../../../types/emit.types.js";
import { detectExpressionType, typeTransformers } from "../core/base-transformer.js";

export const globalContext: EmitContext = {
  isInStatement: false,
  contractName: "",
  strCounter: 0,
  ptrCounter: 0,
};

export function initExpressionContext(name: string): void {
  globalContext.contractName = name;
}

/**
 * Main function to emit code from an expression.
 * Returns an EmitResult object with setup lines and value expression.
 *
 * @param expr - The expression to emit
 * @param isInStatement - Whether the expression is inside a statement
 * @returns EmitResult with setup lines and final expression
 */
function emitExpressionWrapper(expr: any, ctx: EmitContext): EmitResult {
  return emitExpression(expr, ctx.isInStatement);
}

export function emitExpression(expr: any, isInStatement: boolean = false): EmitResult {
  globalContext.isInStatement = isInStatement;
  const typeName = detectExpressionType(expr);
  const transformer = typeName ? typeTransformers[typeName] : null;
  if (transformer && typeof transformer.emit === 'function') {
    return transformer.emit(expr, globalContext, emitExpressionWrapper);
  }
  return {
    setupLines: [],
    valueExpr: handleFallbackExpression(expr),
  };
}

/**
 * Compatibility function for existing code that expects a string.
 * @deprecated Use emitExpression that returns EmitResult
 */
export function emitExpressionAsString(expr: any, isInStatement: boolean = false): string {
  const result = emitExpression(expr, isInStatement);
  return result.valueExpr;
}

function handleFallbackExpression(expr: any): string {
  switch (expr.kind) {
    /**
     * Case "literal": Literal value
     * Example in IR:
     *   { kind: "literal", value: 42 }
     * Example in source code:
     *   42
     */
    case "literal":
      return `"${expr.value}"`;

    /**
     * Case "var": Variable reference
     * Example in IR:
     *   { kind: "var", name: "counter" }
     * Example in source code:
     *   counter
     */
    case "var":
      return expr.name;

    /**
     * Case "member": Property/member access
     * Example in IR:
     *   { kind: "member", object: { kind: "var", name: "Counter" }, property: "value" }
     * Example in source code:
     *   Counter.value
     *   // If object is the contract, emits load_<property>()
     */
    case "member":
      if (expr.object.kind === "var" && expr.object.name === globalContext.contractName)
        return `load_${expr.property}()`;
      const objResult = emitExpression(expr.object);
      return `${objResult.valueExpr}.${expr.property}`;

    /**
     * Case "call": Function or method call
     * Example in IR:
     *   { kind: "call", target: "U256.add", args: [ ... ] }
     * Example in source code:
     *   U256.add(a, b)
     */
    case "call":
      const argResults = expr.args.map((a: any) => emitExpression(a));
      return `${expr.target}(${argResults.map((r: EmitResult) => r.valueExpr).join(", ")})`;

    /**
     * Case "binary": Binary operation (e.g., assignment, arithmetic)
     * Example in IR (assignment):
     *   { kind: "binary", op: "=", left: ..., right: ... }
     * Example in source code:
     *   a = b
     * Example in IR (arithmetic):
     *   { kind: "binary", op: "+", left: ..., right: ... }
     * Example in source code:
     *   a + b
     * Special case: If assigning to a contract property, emits store_<property>(...)
     */
    case "binary": {
      if (expr.op === "=") {
        if (
          expr.left.kind === "member" &&
          expr.left.object.kind === "var" &&
          expr.left.object.name === globalContext.contractName
        ) {
          const property = expr.left.property;
          const rightResult = emitExpression(expr.right);
          return `store_${property}(${rightResult.valueExpr})`;
        }
        const leftResult = emitExpression(expr.left);
        const rightResult = emitExpression(expr.right);
        return `${leftResult.valueExpr} = ${rightResult.valueExpr}`;
      }
    
      const relOps = ["<", ">", "<=", ">=", "==", "!="];
      if (relOps.includes(expr.op)) {
        const lhs = emitExpression(expr.left);   // EmitResult
        const rhs = emitExpression(expr.right);  // EmitResult
    
        switch (expr.op) {
          case "<":  return `U256.lessThan(${lhs.valueExpr}, ${rhs.valueExpr})`;
          case ">":  return `U256.greaterThan(${lhs.valueExpr}, ${rhs.valueExpr})`;
          case "==": return `U256.equals(${lhs.valueExpr}, ${rhs.valueExpr})`;
          case "!=": return `!U256.equals(${lhs.valueExpr}, ${rhs.valueExpr})`;
          case "<=": return `!U256.greaterThan(${lhs.valueExpr}, ${rhs.valueExpr})`;
          case ">=": return `!U256.lessThan(${lhs.valueExpr}, ${rhs.valueExpr})`;
        }
      }
    
      const left  = emitExpression(expr.left);
      const right = emitExpression(expr.right);
      return `${left.valueExpr} ${expr.op} ${right.valueExpr}`;
    }
    
    case "map_set": {
      const keyResult = emitExpression(expr.key);
      const valueResult = emitExpression(expr.value);
      return `Mapping.set(__SLOT${expr.slot.toString(16).padStart(2, "0")}, ${keyResult.valueExpr}, ${valueResult.valueExpr})`;
    }
    
    case "map_get": {
      const keyResult = emitExpression(expr.key);
      return `Mapping.get(__SLOT${expr.slot.toString(16).padStart(2, "0")}, ${keyResult.valueExpr})`;
    }
    case "map_get2": {
      const k1 = emitExpression(expr.key1);
      const k2 = emitExpression(expr.key2);
      return `Mapping2.get(__SLOT${expr.slot.toString(16).padStart(2,"0")}, ${k1.valueExpr}, ${k2.valueExpr})`;
    }
    
    case "map_set2": {
      const k1 = emitExpression(expr.key1);
      const k2 = emitExpression(expr.key2);
      const v  = emitExpression(expr.value);
      return `Mapping2.set(__SLOT${expr.slot.toString(16).padStart(2,"0")}, ${k1.valueExpr}, ${k2.valueExpr}, ${v.valueExpr})`;
    }
    /**
     * Default: Unsupported expression kind
     */
    default:
      return `/* Unsupported expression: ${expr.kind} */`;
  }
}
