import { Expression, SyntaxKind, StringLiteral, NumericLiteral, Identifier, CallExpression, PropertyAccessExpression, Statement, VariableStatement, ExpressionStatement, BinaryExpression, ReturnStatement, IfStatement } from "ts-morph";
import { IRExpression, IRStatement } from "../../../types/ir.types";

/**
 * Converts TypeScript expressions to Intermediate Representation (IR)
 * 
 * @param expr - The TypeScript expression to convert
 * @returns The IR representation of the expression
 */

export function toIRExpr(expr: Expression): IRExpression {
  switch (expr.getKind()) {
    /* ---------- Literal values ---------- */
    // Example: "hello", 42, true, false
    case SyntaxKind.StringLiteral: {
      const lit = expr as StringLiteral;
      return { kind: "literal", value: lit.getLiteralText() };
    }
    case SyntaxKind.NumericLiteral: {
      const lit = expr as NumericLiteral;
      return { kind: "literal", value: Number(lit.getLiteralText()) };
    }
    case SyntaxKind.TrueKeyword:
      return { kind: "literal", value: true };
    case SyntaxKind.FalseKeyword:
      return { kind: "literal", value: false };

    /* ---------- Variables ---------- */
    // Example: counter, value, amount
    case SyntaxKind.Identifier: {
      const id = expr as Identifier;
      return { kind: "var", name: id.getText() };
    }

    /* ---------- Function calls ---------- */
    // Example: increment(), U256Factory.create()
    case SyntaxKind.CallExpression: {
      const call = expr as CallExpression;
      const target = call.getExpression().getText();
      const args = call.getArguments().map(a => toIRExpr(a as Expression));
      return { kind: "call", target, args };
    }

    /* ---------- Member access ---------- */
    // For method access obj.prop, this is a PropertyAccessExpression
    // For property access obj["prop"], this is an ElementAccessExpression
    case SyntaxKind.PropertyAccessExpression: { // Example: contract.balance, u256value.toString()
      const pa = expr as PropertyAccessExpression;
      return {
        kind: "member",
        object: toIRExpr(pa.getExpression()),
        property: pa.getName()
      };
    }

    case SyntaxKind.BinaryExpression: {
      const bin = expr.asKindOrThrow(SyntaxKind.BinaryExpression);
      const op  = bin.getOperatorToken().getText();  // Gets the operator token ("+", "-", "*", "/", "=", etc.)
      return {
        kind:  "binary",
        op,
        left:  toIRExpr(bin.getLeft()  as Expression),
        right: toIRExpr(bin.getRight() as Expression)
      };
    }

    default: 
      throw new Error(`IRExpr: unsupported node kind ${expr.getKindName()}`);
  }
}

/**
 * Converts TypeScript statements to Intermediate Representation (IR)
 * 
 * @param stmt - The TypeScript statement to convert
 * @returns The IR representation of the statement
 */
export function toIRStmt(stmt: Statement): IRStatement {
  switch (stmt.getKind()) {
    /**
     * Variable declaration statement
     * Example: "let counter = 0;", "const value = u256.create();"
     */ 
    case SyntaxKind.VariableStatement: {
      const decl = (stmt as VariableStatement).getDeclarations()[0];
      return {
        kind: "let",
        name: decl.getName(),
        expr: toIRExpr(decl.getInitializerOrThrow())
      };
    }

    case SyntaxKind.ExpressionStatement: {
      const expr = (stmt as ExpressionStatement).getExpression();

      /**
     * Expression statement represents function calls, assignments, etc.
     * Examples: "increment();", "counter = counter + 1;"
     */ 
      /** ---------- ASSIGNMENT: x = <expr> ---------- */
      if (expr.getKind() === SyntaxKind.BinaryExpression) {
        const bin = expr as BinaryExpression;

        if (bin.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
          const lhsNode  = bin.getLeft();
          const rhsNode  = bin.getRight();

          // Only treat as assignment if the LHS is an identifier
          if (lhsNode.getKind() === SyntaxKind.Identifier) {
            const lhsId = lhsNode as Identifier;
            return {
              kind: "assign",
              target: lhsId.getText(),
              expr: toIRExpr(rhsNode)
            };
          }
        }
      }

      /** ---------- SIMPLE CALL: fn() ---------- */
      return { kind: "expr", expr: toIRExpr(expr) };
    }

    /**
     * Return statement for returning values from functions
     * Examples: "return 0;", "return counter.toString();"
     */
    case SyntaxKind.ReturnStatement: {
      const ret = stmt as ReturnStatement;
      // Skip edge cases: when using destructuring, etc.
      return { kind: "return", expr: toIRExpr(ret.getExpressionOrThrow()) };
    }

    /**
     * If statement for conditional execution
     * Example: "if (counter > 10) { reset(); } else { increment(); }"
     */
    case SyntaxKind.IfStatement: {
      const ifs = stmt as IfStatement;
      const cond = toIRExpr(ifs.getExpression());
      const thenStmts = ifs.getThenStatement()
                          .asKindOrThrow(SyntaxKind.Block) 
                          .getStatements()
                          .map(toIRStmt);
      const elseNode = ifs.getElseStatement();
      const elseStmts = elseNode
        ? elseNode.asKindOrThrow(SyntaxKind.Block).getStatements().map(toIRStmt)
        : undefined;
      return { kind: "if", condition: cond, then: thenStmts, else: elseStmts };
    }

    default:
      throw new Error(`IRStmt: unsupported statement kind ${stmt.getKindName()}`);
  }
}