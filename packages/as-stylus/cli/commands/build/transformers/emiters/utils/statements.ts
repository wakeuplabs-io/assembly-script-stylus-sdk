import { emitExpression, getU256FromStringInfo, globalContext } from "./expressions.js";

/**
 * Emits code for a list of statements with indentation
 */
export function emitStatements(statements: any[]): string {
  return statements
    .map((s) => emitStatement(s, "  "))
    .filter((s) => s) // Filter empty statements
    .join("\n");
}

/**
 * Emits code for an individual statement
 * 
 * This function examines an IR statement and generates the corresponding AssemblyScript code.
 * Each statement type has its own code generation logic.
 */
function emitStatement(s: any, indent: string): string {
  let code = '';
  
  switch (s.kind) {
    /**
     * Case "let": Variable declaration
     * 
     * Example: `let x = 5;`
     * 
     * Generates code to declare a variable and assign it a value.
     */
    case "let": { 
      const u256Info = getU256FromStringInfo(s.expr);
      if (u256Info) {
        const lines = [...u256Info.code];
        lines.push(`const ${s.name}: usize = ${u256Info.varName};`);
        return lines.map(line => `${indent}${line}`).join('\n');
      }
      
      code = `${indent}const ${s.name} = ${emitExpression(s.expr, true)};`;
      break;
    }
    
    /**
     * Case "expr": Standalone expression
     * 
     * Example in IR: { kind: "expr", expr: { kind: "call", target: "Counter.counter.add", args: [{ kind: "var", name: "delta" }] } }
     * Example in source code: `Counter.counter.add(delta);`
     * 
     * Generates code for an expression that appears as an independent statement.
     * Special case: Detects add/sub operations on contract properties and
     * generates code that stores the results in storage.
     */
    case "expr": {
      if (s.expr.kind === "call") {
        const target = s.expr.target || "";
        
        if ((target.endsWith(".add") || target.endsWith(".sub"))) {
          const fullTarget = target.substring(0, target.lastIndexOf('.'));
          const parts = fullTarget.split('.');
          
          if (parts.length >= 2 && parts[0] === globalContext.contractName) {
            const property = parts[1];
            const operation = target.endsWith(".add") ? "add" : "sub";
            const ptrName = `ptr${globalContext.ptrCounter++}`;
            
            return `${indent}const ${ptrName} = U256.${operation}(load_${property}(), ${emitExpression(s.expr.args[0])});
${indent}store_${property}(${ptrName});`;
          }
        }
      }
      
      code = `${indent}${emitExpression(s.expr)};`;
      break;
    }
    
    /**
     * Case "return": Return statement
     * 
     * Example in IR: { kind: "return", expr: { kind: "var", name: "counter" } }
     * Example in source code: `return counter;` or simply `return;`
     * 
     * Generates code to return a value or simply exit the function.
     * If s.expr exists, that value is returned, otherwise an empty return is generated.
     */
    case "return": {
      if (s.expr) {
        code = `${indent}return ${emitExpression(s.expr)};`;
      } else {
        code = `${indent}return;`;
      }
      break;
    }
    
    /**
     * Case "if": Conditional statement
     * 
     * Example in IR: 
     * { 
     *   kind: "if", 
     *   condition: { kind: "var", name: "condition" },
     *   then: [{ kind: "expr", expr: { kind: "call", target: "doSomething", args: [] } }],
     *   else: [{ kind: "expr", expr: { kind: "call", target: "doSomethingElse", args: [] } }]
     * }
     * 
     * Example in source code: 
     * ```
     * if (condition) {
     *   doSomething();
     * } else {
     *   doSomethingElse();
     * }
     * ```
     * 
     * Generates code for an if-else conditional structure, with the required
     * 'then' block and the optional 'else' block.
     */
    case "if": {
      code = `${indent}if (${emitExpression(s.condition)}) {\n`;
      code += emitStatements(s.then).split('\n').map(line => `${indent}${line}`).join('\n');
      code += `\n${indent}}`;
      
      if (s.else && s.else.length > 0) {
        code += ` else {\n`;
        code += emitStatements(s.else).split('\n').map(line => `${indent}${line}`).join('\n');
        code += `\n${indent}}`;
      }
      break;
    }
    
    /**
     * Case "block": Code block
     * 
     * Example in IR: 
     * { 
     *   kind: "block", 
     *   body: [{ kind: "expr", expr: { kind: "call", target: "doSomething", args: [] } }]
     * }
     * 
     * Example in source code: 
     * ```
     * {
     *   doSomething();
     * }
     * ```
     * 
     * Generates code for an anonymous code block delimited by braces.
     * These blocks can be used to create a new variable scope.
     */
    case "block": {
      code = `${indent}{\n`;
      code += emitStatements(s.body).split('\n').map(line => `${indent}${line}`).join('\n');
      code += `\n${indent}}`;
      break;
    }
    
    /**
     * Case "assign": Variable assignment
     *
     * This case handles assignments to both local (regular) variables and contract (storage) properties.
     * The code automatically differentiates between these two cases:
     *   - If the target is a local variable, it generates a standard assignment.
     *   - If the target is a contract property (storage variable), it generates a call to the appropriate storage setter function.
     *
     * Example in IR (local variable):
     * {
     *   kind: "assign",
     *   target: "localVar",
     *   expr: { kind: "literal", value: 10 }
     * }
     *
     * Example in source code (local variable):
     * ```
     * localVar = 10;
     * ```
     *
     * Example in IR (storage variable):
     * {
     *   kind: "assign",
     *   target: "counter", // assuming 'counter' is a contract property
     *   expr: { kind: "literal", value: 42 }
     * }
     *
     * Example in source code (storage variable):
     * ```
     * this.counter = 42;
     * // or, depending on the codegen, Storage_set_counter(42);
     * ```
     *
     * The code checks if the target variable is a contract property (usually by consulting the contract's storage definition).
     * If so, it emits a call to the storage setter function (e.g., Storage_set_counter(value)).
     * Otherwise, it emits a regular assignment statement.
     */
    case "assign": {
      if (s.target.indexOf('.') === -1) {
        code = `${indent}${s.target} = ${emitExpression(s.expr)};`;
      } else {
        const parts = s.target.split('.');
        
        if (parts.length === 2 && parts[0] === globalContext.contractName) {
          const property = parts[1];
          code = `${indent}store_${property}(${emitExpression(s.expr)});`;
        } else {
          code = `${indent}${s.target} = ${emitExpression(s.expr)};`;
        }
      }
      break;
    }
    
    default:
      code = `${indent}/* Unsupported statement: ${s.kind} */`;
  }
  
  return code;
}
