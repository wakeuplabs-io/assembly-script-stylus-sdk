import { ExpressionStatement, SyntaxKind, BinaryExpression, Identifier, PropertyAccessExpression, CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRStatement , IRExpression } from "@/cli/types/ir.types.js";

import { ExpressionStatementSyntaxValidator } from "./syntax-validator.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { parseThis } from "../shared/utils/parse-this.js";
import { isExpressionOfStructType, getStructFieldType, isPrimitiveType } from "../struct/struct-utils.js";

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

  private wrapValueWithCopyIfNeeded(valueExpr: IRExpression, fieldType: AbiType | null): IRExpression {
    if (!fieldType || !isPrimitiveType(fieldType)) {
      return valueExpr;
    }
  
    const copyTargets = {
      [AbiType.Uint256]: "U256.copy",
      [AbiType.Bool]: "boolean.copy",
      [AbiType.Address]: "Address.copy",
    };
  
    const copyTarget = copyTargets[fieldType as keyof typeof copyTargets];
    if (!copyTarget) {
      return valueExpr;
    }
  
    return {
        kind: "call",
        target: copyTarget,
        args: [valueExpr],
        type: AbiType.Function,
        returnType: fieldType,
        scope: "memory"
    };
  }

  private handleStructPropertyAssignment(
    objectExpr: IRExpression,
    fieldName: string,
    valueExpr: IRExpression,
    structInfo: { isStruct: boolean; structName: string | null }
  ): IRStatement {
    if (!structInfo.structName) {
      throw new Error("Struct name is required for struct property assignment");
    }

    const struct = this.symbolTable.lookup(structInfo.structName);
    const fieldType = getStructFieldType(structInfo.structName, fieldName);
    const finalValueExpr = this.wrapValueWithCopyIfNeeded(valueExpr, fieldType ?? null);

    return {
      kind: "expr",
      expr: {
        kind: "call",
        target: `${structInfo.structName}_set_${fieldName}`,
        args: [objectExpr, finalValueExpr],
        type: AbiType.Function,
        returnType: AbiType.Void,
        scope: struct?.scope || "memory"
      },
      type: AbiType.Void,
      };
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



  buildIR(): IRStatement {
    const expr = this.statement.getExpression();

    if (expr.getKind() === SyntaxKind.CallExpression) {
      const callExpr = expr as CallExpression;
      const exprText = callExpr.getExpression().getText();
      
      if (exprText.endsWith('.revert')) {
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
    }

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
              target: parseThis(lhsId.getText()),
              expr: new ExpressionIRBuilder(rhsNode).validateAndBuildIR(),
              scope: variable?.scope ?? "memory",
            };
          }
        }

        // Handle property access assignment (obj.field = value)
        if (lhsNode.getKind() === SyntaxKind.PropertyAccessExpression && !lhsNode.getText().startsWith("this.")) {
          const propAccess = lhsNode as PropertyAccessExpression;
          const fieldName = propAccess.getName();
          const objectExpr = new ExpressionIRBuilder(propAccess.getExpression()).validateAndBuildIR();
          const valueExpr = new ExpressionIRBuilder(rhsNode).validateAndBuildIR();
          
          const structInfo = isExpressionOfStructType(objectExpr);
          
          if (structInfo.isStruct && structInfo.structName) {
            return this.handleStructPropertyAssignment(objectExpr, fieldName, valueExpr, structInfo as { isStruct: boolean; structName: string | null });
          } else {
            return this.handleGenericPropertyAssignment(objectExpr, fieldName, valueExpr);
          }
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
}