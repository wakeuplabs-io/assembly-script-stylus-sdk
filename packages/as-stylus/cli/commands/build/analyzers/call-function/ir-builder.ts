import { CallExpression, Expression, PropertyAccessExpression } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { IRExpression, IRMapGet, IRMapGet2, IRMapSet, IRMapSet2 } from "@/cli/types/ir.types.js";
import { FunctionSymbol, VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { buildU256IR } from "./u256.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";

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

    return "void";
  }

  buildIR(): IRExpression {
    const expr = this.call.getExpression();
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
          if (methodName === "get" && args.length === 1) {
            return { kind: "map_get", slot, key: args[0] } as IRMapGet;
          } else if (methodName === "set" && args.length === 2) {
            return { kind: "map_set", slot, key: args[0], value: args[1] } as IRMapSet;
          } else if (methodName === "get" && args.length === 2) {
            return { kind: "map_get2", slot, key1: args[0], key2: args[1] } as IRMapGet2;
          } else if (methodName === "set" && args.length === 3) {
            return { kind: "map_set2", slot, key1: args[0], key2: args[1], value: args[2] } as IRMapSet2;
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

    if (variable?.type === "U256") {
      return buildU256IR(target, this.call, this.symbolTable);
    }
    

    return { kind: "call", target, args, returnType: this.getReturnType(target), scope };
  }

  private lookupSlot(fqName: string): number | undefined {
    return ctx.slotMap.get(fqName);
  }
}
