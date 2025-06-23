import { ExpressionStatement, SyntaxKind, BinaryExpression, Identifier, PropertyAccessExpression } from "ts-morph";

import { IRStatement } from "@/cli/types/ir.types.js";

import { ExpressionStatementSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { ErrorManager } from "../shared/error-manager.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { isStructFieldAccess } from "../struct/struct-utils.js";

// TODO: rename to AssignmentIRBuilder. Merge with VariableIRBuilder.
export class ExpressionStatementIRBuilder extends IRBuilder<IRStatement> {
  private statement: ExpressionStatement;

  constructor(statement: ExpressionStatement, errorManager: ErrorManager) {
    super(errorManager);
    this.statement = statement;
  }

  validate(): boolean {
    const syntaxValidator = new ExpressionStatementSyntaxValidator(
      this.statement,
      this.errorManager,
    );
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
          return {
            kind: "assign",
            target: lhsId.getText(),
            expr: new ExpressionIRBuilder(rhsNode, this.errorManager).validateAndBuildIR(),
          };
        }
        
        // Handle property access assignment (obj.field = value)
        if (lhsNode.getKind() === SyntaxKind.PropertyAccessExpression) {
          const propAccess = lhsNode as PropertyAccessExpression;
          const objectExpr = new ExpressionIRBuilder(propAccess.getExpression(), this.errorManager).validateAndBuildIR();
          const fieldName = propAccess.getName();
          const valueExpr = new ExpressionIRBuilder(rhsNode, this.errorManager).validateAndBuildIR();
          
          const structInfo = isStructFieldAccess(objectExpr);
          
          if (structInfo.isStruct && structInfo.structName) {
            return {
              kind: "expr",
              expr: {
                kind: "call",
                target: `${structInfo.structName}_set_${fieldName}`,
                args: [objectExpr, valueExpr]
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
                  { kind: "literal", value: fieldName },
                  valueExpr
                ]
              }
            };
          }
        }
      }
    }

    // Handle simple expressions (function calls, etc.)
    return {
      kind: "expr",
      expr: new ExpressionIRBuilder(expr, this.errorManager).validateAndBuildIR(),
    };
  }
}
