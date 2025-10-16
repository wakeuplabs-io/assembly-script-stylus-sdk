import { CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { FunctionSymbol, VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { buildAddressIR } from "./address.js";
import { buildArrayIR } from "./array.js";
import { buildI256IR } from "./i256.js";
import { buildMappingIR } from "./mapping.js";
import { buildStringIR } from "./string.js";
import { buildU256IR } from "./u256.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";
import { parseNameWithMethod, parseThis } from "../shared/utils/parse-this.js";
import { StructFactoryBuilder } from "../struct/struct-factory-builder.js";

export class CallFunctionIRBuilder extends IRBuilder<IRExpression> {
  private call: CallExpression;
  private assignmentContext?: { targetScope: "storage" | "memory" };

  constructor(expr: CallExpression) {
    super(expr);
    this.call = expr;
  }

  setAssignmentContext(targetScope: "storage" | "memory"): void {
    this.assignmentContext = { targetScope };
  }

  validate(): boolean {
    return true;
  }

  private extractGenericType(): string | undefined {
    // The generic type arguments are on the CallExpression itself, not the expression
    const typeArgs = this.call.getTypeArguments();

    if (typeArgs.length > 0) {
      return typeArgs[0].getText();
    }

    return undefined;
  }

  private getReturnType(target: string): SupportedType {
    const symbol = this.symbolTable.lookup(target);
    if (symbol && symbol.type === "function") {
      return (symbol as FunctionSymbol).returnType;
    }

    if (symbol && symbol.type === AbiType.UserDefinedFunction) {
      return (symbol as FunctionSymbol).returnType;
    }

    const variable = target.split(".")[0];
    const functionCalled = target.includes("(");

    if (functionCalled) {
      const type = this.getReturnType(target.split("(")[0]);
      return type;
    }

    const variableDeclared = this.symbolTable.lookup(variable);
    if (variableDeclared && variableDeclared.type !== "function") {
      return (variableDeclared as VariableSymbol).type;
    }

    return AbiType.Unknown;
  }

  buildIR(): IRExpression {
    const expr = this.call.getExpression();

    if (StructFactoryBuilder.isStructFactoryCreate(this.call)) {
      return StructFactoryBuilder.buildStructCreateIR(this.symbolTable, this.call);
    }

    const target = parseThis(expr.getText());
    const args = this.call.getArguments().map((argument) => {
      const expressionBuilder = new ExpressionIRBuilder(argument as Expression);
      return expressionBuilder.validateAndBuildIR();
    });

    const { name: varName } = parseNameWithMethod(target);
    const variable = this.symbolTable.lookup(varName);
    // Use assignment context if available, otherwise fall back to variable scope or memory
    const scope = this.assignmentContext?.targetScope ?? variable?.scope ?? "memory";

    if (variable?.type === AbiType.Uint256) {
      return buildU256IR(target, this.call, this.symbolTable);
    }

    if (variable?.type === AbiType.Int256) {
      return buildI256IR(target, this.call, this.symbolTable);
    }

    if (variable?.type === AbiType.String) {
      return buildStringIR(target, this.call, this.symbolTable);
    }

    if (variable?.type === AbiType.Address) {
      return buildAddressIR(target, this.call, this.symbolTable);
    }

    if (variable?.type === AbiType.ArrayStatic || variable?.type === AbiType.ArrayDynamic) {
      const [receiverName, methodName] = target.split(".");
      const receiverVariable = this.symbolTable.lookup(receiverName);

      if (receiverVariable && methodName) {
        return {
          kind: "call",
          target: methodName,
          args,
          type: AbiType.Function,
          returnType: methodName === "length" ? AbiType.Uint256 : AbiType.Void,
          scope,
          receiver: {
            kind: "var",
            name: receiverName,
            type: variable.type,
            scope: receiverVariable.scope ?? "storage",
            isConstant: false,
          },
        };
      }
    }

    if (variable?.type === AbiType.Mapping || variable?.type === AbiType.MappingNested) {
      const slot = this.slotManager.getSlotForVariable(varName);
      const result = buildMappingIR(variable, this.call, slot ?? 0);
      if (result) {
        return result;
      }
    }

    const targetIsArrayFactory =
      target.startsWith("StaticArrayFactory.") ||
      target.startsWith("DynamicArrayFactory.") ||
      target.startsWith("MemoryArrayFactory.");

    if (targetIsArrayFactory) {
      return buildArrayIR(target, this.call, args, scope);
    }

    const isUserDefinedFunction = (this.symbolTable.lookup(target) as FunctionSymbol)
      ?.isDeclaredByUser;
    const type = isUserDefinedFunction ? AbiType.UserDefinedFunction : AbiType.Function;

    // Handle complex expressions like "(i + one).toString"
    let finalReturnType = this.getReturnType(target);
    if (target.includes(".toString")) {
      finalReturnType = AbiType.String;
    } else if (target.includes(".toI32")) {
      finalReturnType = AbiType.Int256;
    } else if (
      target.includes(".add") ||
      target.includes(".sub") ||
      target.includes(".mul") ||
      target.includes(".div")
    ) {
      finalReturnType = AbiType.Uint256;
    }

    return {
      kind: "call" as const,
      target,
      args,
      type,
      returnType: finalReturnType,
      scope,
    };
  }
}
