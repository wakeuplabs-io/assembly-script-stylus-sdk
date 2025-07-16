import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, IRStatement } from "@/cli/types/ir.types.js";

import { emitExpression } from "./expressions.js";
import { SupportedType } from "../../analyzers/shared/supported-types.js";

/**
 * Emits code for a list of statements with indentation
 */
export function emitStatements(statements: IRStatement[]): string {
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
function emitStatement(s: IRStatement, indent: string): string {
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
        lines.push(`${indent}let ${s.name} = ${result.valueExpr};`);
        return lines.join("\n");
      }

      code = `${indent}let ${s.name} = ${result.valueExpr};`;
      break;
    }

    /**
     * Case "const": Constant variable declaration
     *
     * Example: `const x = 5;`
     *
     * Generates code to declare a constant variable and assign it a value.
     * Similar to let but uses const keyword for immutable variables.
     */
    case "const": {
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
      if (!s.expr) {
        code = `${indent}return;`;
        break;
      }
    
      const exprResult = emitExpression(s.expr);
      const type = (s.expr as { type: SupportedType }).type;
    
      const baseExpr = ["Str", "string"].includes(type)
        ? `Str.toABI(${exprResult.valueExpr})`
        : exprResult.valueExpr;
    
      // For boolean mappings, don't wrap with Boolean.create() since they already return proper format
      const isBooleanMapping = baseExpr.includes("Mapping2.getBoolean") || 
                               baseExpr.includes("Mapping.getBoolean");
      
      let returnExpr: string;
      
      if (isBooleanMapping) {
        // Mapping booleans already return correct 32-byte format
        returnExpr = baseExpr;
      } else if (type === AbiType.Bool && !baseExpr.includes("_storage")) {
        // Regular boolean literals get wrapped with Boolean.create()
        returnExpr = `Boolean.create(${baseExpr})`;
      } else {
        returnExpr = baseExpr;
      }
    
      if (exprResult.setupLines.length > 0) {
        const lines = exprResult.setupLines.map((line) => `${indent}${line}`);
        lines.push(`${indent}return ${returnExpr};`);
        return lines.join("\n");
      }
    
      code = `${indent}return ${returnExpr};`;
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
        const property = parts[0];
        lines.push(`${indent}store_${property}(${exprResult.valueExpr});`);
      }

      if (s.scope === "storage") {
        const property = s.target;
        lines.push(`${indent}store_${property}(${exprResult.valueExpr});`);
      }

      if (lines.length > 1) {
        return lines.join("\n");
      }

      code = lines[0];
      break;
    }

    /**
     * Case "revert": Custom error revert statement
     *
     * Example: ERC721InvalidOwner.revert(owner);
     *
     * Generates code to revert with custom error data.
     */
    case "revert": {
      // Use the error transformer to handle the revert
      const revertExpression: IRExpression = {
        kind: "call",
        target: `${s.error}.revert`,
        args: s.args,
        returnType: AbiType.Void,
        scope: "memory"
      };
      
      const result = emitExpression(revertExpression, true);
      
      if (result.setupLines && result.setupLines.length > 0) {
        return result.setupLines.map((line) => `${indent}${line}`).join("\n");
      }
      
      code = `${indent}${result.valueExpr};`;
      break;
    }

    /**
     * Case "for": For loop statement
     *
     * Example in IR:
     * {
     *   kind: "for",
     *   init: { kind: "let", name: "i", expr: { kind: "call", target: "U256Factory.create" } },
     *   condition: { kind: "condition", left: { kind: "call", target: "i.lessThan", args: [...] } },
     *   update: { kind: "binary", op: "=", left: { kind: "var", name: "i" }, right: { kind: "call", target: "i.add", args: [...] } },
     *   body: [...]
     * }
     *
     * Example in source code:
     * ```
     * for (let i = U256.create(); i.lessThan(limit); i = i.add(U256.fromString("1"))) {
     *   // body statements
     * }
     * ```
     *
     * Generates code for a for loop with proper U256/I256 support for conditions and updates.
     */
         case "for": {
       const lines: string[] = [];
       
       // Handle initialization (can be let statement or expression)
       let initCode = "";
       if (s.init) {
         if (s.init.kind === "let") {
           const initResult = emitExpression(s.init.expr, true);
           if (initResult.setupLines && initResult.setupLines.length > 0) {
             // Add setup lines before the for loop
             lines.push(...initResult.setupLines.map(line => `${indent}${line}`));
             initCode = `let ${s.init.name} = ${initResult.valueExpr}`;
           } else {
             initCode = `let ${s.init.name} = ${initResult.valueExpr}`;
           }
         } else {
           // For non-let initialization, emit as statement and extract the code
           const initStatement = emitStatement(s.init, "");
           initCode = initStatement.trim();
         }
       }
      
      // Handle condition (supports U256/I256 comparisons)
      let conditionCode = "";
      if (s.condition) {
        const condResult = emitExpression(s.condition);
        if (condResult.setupLines && condResult.setupLines.length > 0) {
          lines.push(...condResult.setupLines.map(line => `${indent}${line}`));
        }
        conditionCode = condResult.valueExpr;
      }
      
      // Handle update expression  
      let updateCode = "";
      if (s.update) {
        const updateResult = emitExpression(s.update);
        updateCode = updateResult.valueExpr;
      }
      
      // Generate for statement
      lines.push(`${indent}for (${initCode}; ${conditionCode}; ${updateCode}) {`);
      
      // Generate body with proper indentation
      const bodyCode = emitStatements(s.body);
      if (bodyCode.trim()) {
        lines.push(bodyCode.split("\n").map(line => `${indent}${line}`).join("\n"));
      }
      
      lines.push(`${indent}}`);
      
      return lines.join("\n");
    }

    /**
     * Case "while": While loop statement
     *
     * Example in IR:
     * {
     *   kind: "while",
     *   condition: { kind: "condition", left: { kind: "call", target: "i.lessThan", args: [...] } },
     *   body: [...]
     * }
     *
     * Example in source code:
     * ```
     * while (i.lessThan(limit)) {
     *   // body statements
     * }
     * ```
     *
     * Generates code for a while loop with proper U256/I256 condition support.
     */
         case "while": {
       const lines: string[] = [];
      
      // Handle condition (supports U256/I256 comparisons)
      const condResult = emitExpression(s.condition);
      if (condResult.setupLines && condResult.setupLines.length > 0) {
        lines.push(...condResult.setupLines.map(line => `${indent}${line}`));
      }
      
      lines.push(`${indent}while (${condResult.valueExpr}) {`);
      
      // Generate body with proper indentation
      const bodyCode = emitStatements(s.body);
      if (bodyCode.trim()) {
        lines.push(bodyCode.split("\n").map(line => `${indent}${line}`).join("\n"));
      }
      
      lines.push(`${indent}}`);
      
      return lines.join("\n");
    }

    /**
     * Case "do_while": Do-while loop statement
     *
     * Example in IR:
     * {
     *   kind: "do_while",
     *   body: [...],
     *   condition: { kind: "condition", left: { kind: "call", target: "i.lessThan", args: [...] } }
     * }
     *
     * Example in source code:
     * ```
     * do {
     *   // body statements
     * } while (i.lessThan(limit));
     * ```
     *
     * Generates code for a do-while loop with proper U256/I256 condition support.
     */
         case "do_while": {
       const lines: string[] = [];
      
      lines.push(`${indent}do {`);
      
      // Generate body with proper indentation
      const bodyCode = emitStatements(s.body);
      if (bodyCode.trim()) {
        lines.push(bodyCode.split("\n").map(line => `${indent}${line}`).join("\n"));
      }
      
      lines.push(`${indent}} while (${emitExpression(s.condition).valueExpr});`);
      
      return lines.join("\n");
    }

    default:
      code = `${indent}/* Unsupported statement: ${(s as { kind: string }).kind} */`;
  }

  return code;
}
