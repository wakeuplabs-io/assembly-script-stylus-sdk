import { CallExpression, ObjectLiteralExpression, PropertyAssignment, SyntaxKind } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { extractStructTypeFromCall } from "./struct-utils.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { SymbolTableStack } from "../shared/symbol-table.js";

/**
 * Specialized builder for StructFactory.create<T>() calls
 * Handles the creation of struct instances in memory with initialization
 */
export class StructFactoryBuilder {
  /**
   * Checks if this call expression is a StructFactory.create call
   */
  static isStructFactoryCreate(call: CallExpression): boolean {
    const expr = call.getExpression();
    return expr.getText() === "StructFactory.create";
  }

  /**
   * Builds IR for StructFactory.create<StructType>([...values])
   */
  static buildStructCreateIR(symbolTable: SymbolTableStack, call: CallExpression): IRExpression {
    // Extract the struct type from generic parameter
    const structType = extractStructTypeFromCall(call);
    const structTemplate = symbolTable.getStructTemplateByName(structType!);

    if (!structType) {
      throw new Error(
        "StructFactory.create requires a type parameter: StructFactory.create<StructType>",
      );
    }

    // Verify the struct exists in registry
    const struct = symbolTable.getStructTemplateByName(structType);
    if (!struct) {
      throw new Error(`Unknown struct type: ${structType}`);
    }

    // Get the array argument with initial values
    const args = call.getArguments();
    if (args.length !== 1) {
      throw new Error("StructFactory.create expects exactly one array argument");
    }

    // Build IR for the array elements
    const arrayArg = args[0];
    const initialValues: IRExpression[] = [];

    const value = arrayArg.getKind();
    if (value === SyntaxKind.ObjectLiteralExpression) {
      const elements = (arrayArg as ObjectLiteralExpression).getProperties();
      structTemplate?.fields.map((field) => {
        const element = elements.find(
          (el) => (el as PropertyAssignment).getNameNode().getText() === field.name,
        );
        if (element) {
          const pa = element as PropertyAssignment;
          const value = pa.getInitializer()!;
          const builder = new ExpressionIRBuilder(value);
          initialValues.push(builder.validateAndBuildIR());
        }
      });
    }

    // Return IR for struct creation with initialization
    const result = {
      kind: "call",
      target: "StructFactory.create",
      args: initialValues,
      returnType: AbiType.Struct,
      scope: "memory",
      // Add metadata for later processing
      metadata: {
        structType,
        isStructCreation: true,
      },
    } as IRExpression & {
      metadata: {
        structType: string;
        isStructCreation: boolean;
      };
    };

    return result;
  }
}
