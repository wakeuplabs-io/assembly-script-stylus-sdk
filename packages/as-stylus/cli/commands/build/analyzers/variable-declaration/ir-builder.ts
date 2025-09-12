import { Expression, VariableDeclaration } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRStatement, IRExpression } from "@/cli/types/ir.types.js";
import { VariableSymbol } from "@/cli/types/symbol-table.types.js";
import { inferType } from "@/cli/utils/inferType.js";

import { VariableDeclarationSyntaxValidator } from "./syntax-validator.js";
import { convertType } from "../../builder/build-abi.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { parseThis } from "../shared/utils/parse-this.js";

/**
 * Builds the IR for a variable declaration statement
 * @param declaration - The TypeScript variable declaration node
 * @returns IRStatement representing the variable declaration
 * @throws Error if the declaration is invalid or cannot be processed
 * @example "let counter = 0;"
 */
export class VariableDeclarationIRBuilder extends IRBuilder<IRStatement> {
  private declaration: VariableDeclaration;

  constructor(declaration: VariableDeclaration) {
    super(declaration);
    this.declaration = declaration;
  }

  validate(): boolean {
    const syntaxValidator = new VariableDeclarationSyntaxValidator(this.declaration);
    return syntaxValidator.validate();
  }

  private getDeclarationKind(): "let" | "const" {
    const variableStatement = this.declaration.getVariableStatement();
    if (!variableStatement) return "let";
    const declarationList = variableStatement.getDeclarationList();
    const keywordNodes = declarationList.getDeclarationKindKeywords();
    return keywordNodes[0].getText() === "const" ? "const" : "let";
  }

  private createVariable(initializer: string) {
    const name = parseThis(this.declaration.getName());
    const dynamicType = inferType(this.symbolTable, initializer);

    const variable: VariableSymbol = {
      name,
      type: convertType(this.symbolTable, dynamicType),
      dynamicType,
      scope: "memory",
    };

    return variable;
  }

  private buildDeclaration(variable: VariableSymbol, kind: "let" | "const") {
    this.symbolTable.declareVariable(variable.name, variable);

    return {
      kind,
      name: variable.name,
      type: variable.type,
      expr: { kind: "literal", value: null, type: variable.type } as const,
      scope: variable.scope,
    };
  }

  private buildAssignment(
    variable: VariableSymbol,
    initializer: Expression,
    kind: "let" | "const",
  ) {
    const expression = new ExpressionIRBuilder(initializer).validateAndBuildIR();

    if (variable.type === AbiType.Any || variable.type === AbiType.Unknown) {
      const inferredType = this.inferTypeFromExpression(expression);
      if (inferredType) {
        variable.type = inferredType;
      }
    }
    this.symbolTable.declareVariable(variable.name, variable);

    return {
      kind,
      name: variable.name,
      type: variable.type,
      expr: expression,
      scope: variable.scope,
    };
  }

  /**
   * Infers the type from an IR expression by checking for returnType or type properties
   * @param expression - The IR expression to analyze
   * @returns The inferred type or undefined if no type information is available
   */
  private inferTypeFromExpression(expression: IRExpression): AbiType | undefined {
    if ('returnType' in expression && expression.returnType) {
      return expression.returnType as AbiType;
    }

    if ('type' in expression && expression.type) {
      return expression.type as AbiType;
    }

    return undefined;
  }

  buildIR(): IRStatement {
    const initializer = this.declaration.getInitializer();
    const variable = this.createVariable(initializer?.getText() ?? "");

    const kind = this.getDeclarationKind();

    if (!initializer) {
      return this.buildDeclaration(variable, kind);
    } else {
      return this.buildAssignment(variable, initializer, kind);
    }
  }
}


