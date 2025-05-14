import { Expression, SyntaxKind, StringLiteral, NumericLiteral, Identifier, CallExpression, PropertyAccessExpression, Statement, VariableStatement, ExpressionStatement, BinaryExpression, ReturnStatement, IfStatement } from "ts-morph";
import { IRExpression, IRStatement } from "../../../types/ir.types";

export function toIRExpr(expr: Expression): IRExpression {
  switch (expr.getKind()) {
    /* ---------- literales ---------- */
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

    /* ---------- variable ---------- */
    case SyntaxKind.Identifier: {
      const id = expr as Identifier;
      return { kind: "var", name: id.getText() };
    }

    /* ---------- llamada ---------- */
    case SyntaxKind.CallExpression: {
      const call = expr as CallExpression;
      const target = call.getExpression().getText();
      const args = call.getArguments().map(a => toIRExpr(a as Expression));
      return { kind: "call", target, args };
    }

    /* ---------- acceso a miembro ---------- */
    case SyntaxKind.PropertyAccessExpression: {
      const pa = expr as PropertyAccessExpression;
      return {
        kind: "member",
        object: toIRExpr(pa.getExpression()),
        property: pa.getName()
      };
    }

    case SyntaxKind.BinaryExpression: {
      const bin = expr.asKindOrThrow(SyntaxKind.BinaryExpression);
      const op  = bin.getOperatorToken().getText();      // "+", "-", ">", "="…
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

export function toIRStmt(stmt: Statement): IRStatement {
  switch (stmt.getKind()) {
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

      /** ---------- ASIGNACIÓN:  x = <expr> ---------- */
      if (expr.getKind() === SyntaxKind.BinaryExpression) {
        const bin = expr as BinaryExpression;

        if (bin.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
          const lhsNode  = bin.getLeft();
          const rhsNode  = bin.getRight();

          // sólo tratamos como asignación si el LHS es un identificador
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

      /** ---------- EXPR SUELTA ---------- */
      return { kind: "expr", expr: toIRExpr(expr) };
    }

    case SyntaxKind.ReturnStatement: {
      const ret = stmt as ReturnStatement;
      return { kind: "return", expr: toIRExpr(ret.getExpressionOrThrow()) };
    }

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