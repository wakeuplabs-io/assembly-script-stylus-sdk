import { ExpressionStatement, SyntaxKind, BinaryExpression, PropertyAccessExpression, CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRStatement, IRExpression } from "@/cli/types/ir.types.js";

import { StructAssignmentBuilder } from "./struct.js";
import { ExpressionStatementSyntaxValidator } from "./syntax-validator.js";
import { CallFunctionIRBuilder } from "../call-function/ir-builder.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { parseThis } from "../shared/utils/parse-this.js";

export class ExpressionStatementIRBuilder extends IRBuilder<IRStatement> {
  private statement: ExpressionStatement;

  constructor(statement: ExpressionStatement) {
    super(statement);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new ExpressionStatementSyntaxValidator(this.statement);
    return syntaxValidator.validate();
  }

  private handleGenericPropertyAssignment(
    objectExpr: IRExpression,
    fieldName: string,
    valueExpr: IRExpression
  ): IRStatement {
    const args: IRExpression[] = [];
    if (objectExpr.kind !== "this") {
      args.push(objectExpr);
    }
    args.push({ kind: "literal", value: fieldName, type: AbiType.String });
    args.push(valueExpr);
    return {
      kind: "expr",
      expr: {
        kind: "call",
        target: "property_set",
        args,
        type: AbiType.Function,
        returnType: AbiType.Void,
        scope: "memory"
      },
      type: AbiType.Void,
    };
  }

  private buildRevertExpressionIR(exprText: string, callExpr: CallExpression): IRStatement {
    const errorName = exprText.slice(0, -'.revert'.length);
    const args = callExpr.getArguments().map(arg => {
      const builder = new ExpressionIRBuilder(arg as Expression);
      return builder.validateAndBuildIR();
    });
    return {
      kind: "revert",
      error: errorName,
      args
    };
  }

  buildIR(): IRStatement {
    const expr = this.statement.getExpression();

    if (expr.getKind() === SyntaxKind.CallExpression) {
      const callExpr = expr as CallExpression;
      const exprText = callExpr.getExpression().getText();

      if (exprText.endsWith('.revert')) {
        return this.buildRevertExpressionIR(exprText, callExpr);
      }
    }

    if (expr.getKind() === SyntaxKind.BinaryExpression) {
      const bin = expr as BinaryExpression;
      if (bin.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
        const lhsNode = bin.getLeft();
        const rhsNode = bin.getRight();

        // Handle simple identifier assignment (x = y)
        const target = parseThis(lhsNode.getText());
        const [name] = target.split(".");
        const variable = this.symbolTable.lookup(name);

        // Handle property access assignment (obj.field = value)
        if (lhsNode.getKind() === SyntaxKind.PropertyAccessExpression && variable?.type === AbiType.Struct) {
          const propAccess = lhsNode as PropertyAccessExpression;
          const fieldName = propAccess.getName();
          const objectExpr = new ExpressionIRBuilder(propAccess.getExpression()).validateAndBuildIR();
          const valueExpr = new ExpressionIRBuilder(rhsNode).validateAndBuildIR();
          if (objectExpr.type === AbiType.Struct) {
            return new StructAssignmentBuilder(this.symbolTable).buildIR(objectExpr, fieldName, valueExpr);
          } else {
            return this.handleGenericPropertyAssignment(objectExpr, fieldName, valueExpr);
          }
        }

        if (lhsNode.getKind() === SyntaxKind.PropertyAccessExpression) {
          const rhsExpr = this.buildExpressionWithAssignmentContext(rhsNode, variable?.scope ?? "memory");
          return {
            kind: "assign",
            target: target,
            expr: rhsExpr,
            scope: variable?.scope ?? "memory",
          };
        }

      }
    }

    const expression = new ExpressionIRBuilder(expr).validateAndBuildIR();
    // Handle simple expressions (function calls, etc.)
    return {
      kind: "expr",
      expr: expression,
      type: expression.type,
    };
  }

  private buildExpressionWithAssignmentContext(expr: Expression, targetScope: "storage" | "memory"): IRExpression {
    // For CallExpression, we need to pass the assignment context
    if (expr.getKind() === SyntaxKind.CallExpression) {
      const callExpr = expr as CallExpression;
      const callBuilder = new CallFunctionIRBuilder(callExpr);
      callBuilder.setAssignmentContext(targetScope);
      return callBuilder.validateAndBuildIR();
    }
    // For other expressions, use regular ExpressionIRBuilder
    return new ExpressionIRBuilder(expr).validateAndBuildIR();
  }
}