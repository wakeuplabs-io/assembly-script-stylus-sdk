import { emitExpression, globalContext } from "./expressions.js";

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
  let code = "";

  switch (s.kind) {
    /**
     * Case "let": Variable declaration
     *
     * Example: `let x = 5;`
     *
     * Generates code to declare a variable and assign it a value.
     * Improved case that takes advantage of setupLines from transformers
     * This allows each transformer to decide how to initialize its type
     * without needing special cases here
     */
    case "let": {
      const result = emitExpression(s.expr, true);
      if (result.setupLines && result.setupLines.length > 0) {
        const lines = [...result.setupLines.map((line) => `${indent}${line}`)];
        lines.push(`${indent}const ${s.name} = ${result.valueExpr};`);
        return lines.join("\n");
      }

      code = `${indent}const ${s.name} = ${result.valueExpr};`;
      break;
    }

    /**
     * Case "expr": Expression statement
     *
     * Example in IR: { kind: "expr", expr: { kind: "call", target: "Counter.counter.add", args: [{ kind: "var", name: "delta" }] } }
     * Example in source code: `Counter.counter.add(delta);`
     *
     * Generates code for an expression that appears as an independent statement.
     * Special case: Detects add/sub operations on contract properties and
     * generates code that stores the results in storage.
     */
    case "expr": {
      const exprResult = emitExpression(s.expr, true);

      if (exprResult.statementLines?.length) {
        return exprResult.statementLines.map((l) => indent + l).join("\n");
      }

      if (exprResult.setupLines.length) {
        const lines = exprResult.setupLines.map((l) => indent + l);
        
        if (exprResult.valueExpr.trim() !== "" && !exprResult.valueExpr.trim().startsWith("/*")) {
          lines.push(`${indent}${exprResult.valueExpr};`);
        }
        
        return lines.join("\n");
      }

      return exprResult.valueExpr.trim() !== "" ? 
        `${indent}${exprResult.valueExpr};` : 
        "";
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
        const exprResult = emitExpression(s.expr);
        if (exprResult.setupLines.length > 0) {
          const lines: string[] = [...exprResult.setupLines.map((line) => `${indent}${line}`)];
          const returnExpr = ["Str", "string"].includes(s.expr.type) ? 
            `Str.toABI(${exprResult.valueExpr})` : 
            exprResult.valueExpr;
          lines.push(`${indent}return ${returnExpr};`);
          return lines.join("\n");
        }

        const returnExpr = ["Str", "string"].includes(s.expr.type) ? 
          `Str.toABI(${exprResult.valueExpr})` : 
          exprResult.valueExpr;
        code = `${indent}return ${returnExpr};`;
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
      const condResult = emitExpression(s.condition);

      let lines: string[] = [];
      if (condResult.setupLines.length > 0) {
        lines = [...condResult.setupLines.map((line) => `${indent}${line}`)];
      }

      lines.push(`${indent}if (${condResult.valueExpr}) {`);
      lines.push(
        emitStatements(s.then)
          .split("\n")
          .map((line) => `${indent}${line}`)
          .join("\n"),
      );
      lines.push(`${indent}}`);

      if (s.else && s.else.length > 0) {
        lines[lines.length - 1] += " else {"; // Añadir el 'else' a la línea del cierre de '}'
        lines.push(
          emitStatements(s.else)
            .split("\n")
            .map((line) => `${indent}${line}`)
            .join("\n"),
        );
        lines.push(`${indent}}`);
      }

      return lines.join("\n");
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
      code += emitStatements(s.body)
        .split("\n")
        .map((line) => `${indent}${line}`)
        .join("\n");
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
      const exprResult = emitExpression(s.expr);
      let lines: string[] = [];

      if (exprResult.setupLines.length > 0) {
        lines = [...exprResult.setupLines.map((line) => `${indent}${line}`)];
      }

      if (s.target.indexOf(".") === -1) {
        lines.push(`${indent}${s.target} = ${exprResult.valueExpr};`);
      } else {
        const parts = s.target.split(".");

        if (parts[0] === globalContext.contractName) {
          const property = parts[1];
          lines.push(`${indent}store_${property}(${exprResult.valueExpr});`);
        } else {
          lines.push(`${indent}${s.target} = ${exprResult.valueExpr};`);
        }
      }

      if (lines.length > 1) {
        return lines.join("\n");
      }

      code = lines[0];
      break;
    }

    default:
      code = `${indent}/* Unsupported statement: ${s.kind} */`;
  }

  return code;
}
