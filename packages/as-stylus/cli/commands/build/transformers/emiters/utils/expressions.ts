import { EmitContext, typeTransformers, detectExpressionType } from '../types/transformers.js';
import '../transformers/u256.transformer.js';

export const globalContext: EmitContext = {
  isInStatement: false,
  contractName: '',
  strCounter: 0,
  ptrCounter: 0
};

export function initExpressionContext(name: string): void {
  globalContext.contractName = name;
}

export function emitExpression(expr: any, isInStatement: boolean = false): string {
  globalContext.isInStatement = isInStatement;
  
  const typeName = detectExpressionType(expr);
  const transformer = typeName ? typeTransformers[typeName] : null;
  
  if (transformer) {
    return handleWithTransformer(expr, transformer);
  }
  
  return handleFallbackExpression(expr);
}

function handleWithTransformer(expr: any, transformer: any): string {
  if (expr.kind === "call") {
    const target = expr.target || "";
    
    if (target === `${transformer.typeName}Factory.create`) {
      return transformer.emitCreateExpression(expr.args, globalContext);
    }
    
    if (target === `${transformer.typeName}Factory.fromString`) {
      return transformer.emitFromStringExpression(expr.args[0], globalContext);
    }
    
    if (target.includes(".")) {
      const parts = target.split(".");
      const methodName = parts[parts.length - 1];
      
      if (transformer.canHandleMethodCall(methodName, target)) {
        return transformer.emitMethodCall(
          methodName,
          target,
          expr.args,
          globalContext,
          emitExpression
        );
      }
    }
  }
  
  return handleFallbackExpression(expr);
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
      return `${emitExpression(expr.object)}.${expr.property}`;

    /**
     * Case "call": Function or method call
     * Example in IR:
     *   { kind: "call", target: "U256.add", args: [ ... ] }
     * Example in source code:
     *   U256.add(a, b)
     */
    case "call":
      return `${expr.target}(${expr.args.map((a: any) => emitExpression(a)).join(", ")})`;

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
    case "binary":
      if (expr.op === "=") {
        if (expr.left.kind === "member" && 
            expr.left.object.kind === "var" && 
            expr.left.object.name === globalContext.contractName) {
          const property = expr.left.property;
          return `store_${property}(${emitExpression(expr.right)})`;
        }
        return `${emitExpression(expr.left)} = ${emitExpression(expr.right)}`;
      }
      return `${emitExpression(expr.left)} ${expr.op} ${emitExpression(expr.right)}`;

    /**
     * Default: Unsupported expression kind
     */
    default:
      return `/* Unsupported expression: ${expr.kind} */`;
  }
}

export function getU256FromStringInfo(expr: any): {
  code: string[], 
  varName: string 
} | null {
  if (expr.kind !== "call" || expr.target !== "U256Factory.fromString") {
    return null;
  }
  
  const stringArg = expr.args[0];
  if (stringArg.kind !== "literal") {
    return null;
  }
  
  const stringValue = stringArg.value;
  const strId = globalContext.strCounter++;
  const u256Id = `__u256${strId}`;
  const mallocId = `__str${strId}`;
  
  const code: string[] = [];
  code.push(`const ${mallocId} = malloc(${stringValue.length});`);
  
  for (let i = 0; i < stringValue.length; i++) {
    code.push(`store<u8>(${mallocId} + ${i}, ${stringValue.charCodeAt(i)});`);
  }
  
  code.push(`const ${u256Id}: usize = U256.create();`);
  code.push(`U256.setFromString(${u256Id}, ${mallocId}, ${stringValue.length});`);
  
  return {
    code,
    varName: u256Id
  };
}
