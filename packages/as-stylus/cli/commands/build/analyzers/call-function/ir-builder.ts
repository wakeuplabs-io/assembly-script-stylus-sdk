import { CallExpression, Expression, PropertyAccessExpression } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, IRMapGet, IRMapGet2, IRMapSet, IRMapSet2 } from "@/cli/types/ir.types.js";
import { FunctionSymbol, VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { buildAddressIR } from "./address.js";
import { buildI256IR } from "./i256.js";
import { buildStringIR } from "./string.js";
import { buildU256IR } from "./u256.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";
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

    const variable = target.split(".")[0];
    const variableDeclared = this.symbolTable.lookup(variable);
    if (variableDeclared && variableDeclared.type !== "function") {
      return (variableDeclared as VariableSymbol).type;
    }

    return AbiType.Unknown;
  }

  buildIR(): IRExpression {
    const expr = this.call.getExpression();
    
    if (StructFactoryBuilder.isStructFactoryCreate(this.call)) {
      return StructFactoryBuilder.buildStructCreateIR(this.call);
    }
    
    // Try to detect Mapping access: Balances.balances.get(user) or .set(user, value)
    if (expr.getKindName() === "PropertyAccessExpression") {
      const methodAccess = expr as PropertyAccessExpression;
      const methodName = methodAccess.getName();
      const mappingExpr = methodAccess.getExpression();

      if (mappingExpr.getKindName() === "Identifier") {
        const mappingName = mappingExpr.getText();

        const slot = this.lookupSlot(mappingName);
        const args = this.call.getArguments().map((arg) => {
          const builder = new ExpressionIRBuilder(arg as Expression);
          return builder.validateAndBuildIR();
        });

        if (slot !== undefined) {
          // Get mapping type information from context
          const mappingTypeInfo = ctx.mappingTypes.get(mappingName);
          
          if (methodName === "get" && args.length === 1) {
            return { 
              kind: "map_get", 
              slot, 
              key: args[0],
              keyType: mappingTypeInfo?.keyType || "Address",
              valueType: mappingTypeInfo?.valueType || "U256"
            } as IRMapGet;
          } else if (methodName === "set" && args.length === 2) {
            return { 
              kind: "map_set", 
              slot, 
              key: args[0], 
              value: args[1],
              keyType: mappingTypeInfo?.keyType || "Address",
              valueType: mappingTypeInfo?.valueType || "U256"
            } as IRMapSet;
          } else if (methodName === "get" && args.length === 2) {
            return { 
              kind: "map_get2", 
              slot, 
              key1: args[0], 
              key2: args[1],
              keyType1: mappingTypeInfo?.keyType1 || "Address",
              keyType2: mappingTypeInfo?.keyType2 || "Address",
              valueType: mappingTypeInfo?.valueType || "U256"
            } as IRMapGet2;
          } else if (methodName === "set" && args.length === 3) {
            return { 
              kind: "map_set2", 
              slot, 
              key1: args[0], 
              key2: args[1], 
              value: args[2],
              keyType1: mappingTypeInfo?.keyType1 || "Address",
              keyType2: mappingTypeInfo?.keyType2 || "Address",
              valueType: mappingTypeInfo?.valueType || "U256"
            } as IRMapSet2;
          }
        }
      }
    }
    const target = expr.getText();
    const args = this.call.getArguments().map((argument) => {
      const expressionBuilder = new ExpressionIRBuilder(argument as Expression);
      return expressionBuilder.validateAndBuildIR();
    });

    const [varName] = target.split(".");
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

    return { kind: "call", target, args, returnType: this.getReturnType(target), scope };
  }

  private lookupSlot(fqName: string): number | undefined {
    return ctx.slotMap.get(fqName);
  }
}
