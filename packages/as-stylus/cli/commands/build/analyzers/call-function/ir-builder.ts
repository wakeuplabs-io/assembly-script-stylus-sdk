import { CallExpression, Expression } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { FunctionSymbol, VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { buildAddressIR } from "./address.js";
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

  constructor(expr: CallExpression) {
    super(expr);
    this.call = expr;
  }

  validate(): boolean {
    return true;
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
    const scope = variable?.scope ?? "memory";

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

    if (variable?.type === AbiType.Mapping || variable?.type === AbiType.MappingNested) {
      const slot = this.slotManager.getSlotForVariable(varName);
      const result = buildMappingIR(variable, this.call, slot ?? 0);
      if (result) {
        return result;
      }
    }

    const isUserDefinedFunction = (this.symbolTable.lookup(target) as FunctionSymbol)
      ?.isDeclaredByUser;
    const type = isUserDefinedFunction ? AbiType.UserDefinedFunction : AbiType.Function;

    return { kind: "call", target, args, type, returnType: this.getReturnType(target), scope };
  }
}
