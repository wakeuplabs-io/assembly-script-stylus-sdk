import { ExpressionStatement, SyntaxKind, BinaryExpression, Identifier, PropertyAccessExpression } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { ExpressionStatementSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { isExpressionOfStructType } from "../struct/struct-utils.js";

// TODO: rename to AssignmentIRBuilder. Merge with VariableIRBuilder.
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

  buildIR(): IRStatement {
    const expr = this.statement.getExpression();

    // Handle assignment expressions (x = y)
    if (expr.getKind() === SyntaxKind.BinaryExpression) {
      const bin = expr as BinaryExpression;
      if (bin.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
        const lhsNode = bin.getLeft();
        const rhsNode = bin.getRight();

        // Handle simple identifier assignment (x = y)
        if (lhsNode.getKind() === SyntaxKind.Identifier) {
          const lhsId = lhsNode as Identifier;
          const variable = this.symbolTable.lookup(lhsId.getText());

          //TODO: revise this
          if (variable?.scope === "memory") { 
            return {
              kind: "assign",
              target: lhsId.getText(),
              expr: new ExpressionIRBuilder(rhsNode).validateAndBuildIR(),
              scope: variable?.scope ?? "memory",
            };
          }
        }
        
        // Handle property access assignment (obj.field = value)
        if (lhsNode.getKind() === SyntaxKind.PropertyAccessExpression) {
          const propAccess = lhsNode as PropertyAccessExpression;
          const objectExpr = new ExpressionIRBuilder(propAccess.getExpression()).validateAndBuildIR();
          const fieldName = propAccess.getName();
          const valueExpr = new ExpressionIRBuilder(rhsNode).validateAndBuildIR();
          
          const structInfo = isExpressionOfStructType(objectExpr);
          if (structInfo.isStruct && structInfo.structName) {
            const struct = this.symbolTable.lookup(structInfo.structName);
            return {
              kind: "expr",
              expr: {
                kind: "call",
                target: `${structInfo.structName}_set_${fieldName}`,
                args: [objectExpr, valueExpr],
                returnType: "void",
                scope: struct?.scope || "memory"
              }
            };
          } else {
            // Not a struct: treat as regular assignment
            // TODO: Handle other types of property assignments
            return {
              kind: "expr",
              expr: {
                kind: "call",
                target: `property_set`,
                args: [
                  objectExpr,
                  { kind: "literal", value: fieldName, type: "string" },
                  valueExpr
                ],
                returnType: "void",
                scope: "memory"
              }
            };
          }
        }
      }
    }

    // Handle simple expressions (function calls, etc.)
    return {
      kind: "expr",
      expr: new ExpressionIRBuilder(expr).validateAndBuildIR(),
    };
  }
}
