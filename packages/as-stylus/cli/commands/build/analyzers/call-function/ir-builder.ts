import { CallExpression, Expression, PropertyAccessExpression } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { IRExpression, IRMapGet, IRMapGet2, IRMapSet, IRMapSet2 } from "@/cli/types/ir.types.js";

import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class CallFunctionIRBuilder extends IRBuilder<IRExpression> {
  private call: CallExpression;

  constructor(expr: CallExpression) {
    super(expr);
    this.call = expr;
  }

  validate(): boolean {
    return true;
  }

  buildIR(): IRExpression {
    const expr = this.call.getExpression();
    // Try to detect Mapping access: Balances.balances.get(user) or .set(user, value)
    if (expr.getKindName() === "PropertyAccessExpression") {
      const methodAccess = expr as PropertyAccessExpression;
      const methodName = methodAccess.getName();
      const mappingExpr = methodAccess.getExpression(); // Balances.balances
      
      if (mappingExpr.getKindName() === "PropertyAccessExpression") {
        const innerAccess = mappingExpr as PropertyAccessExpression;
        const className = innerAccess.getExpression().getText(); // e.g. Balances
        const mappingName = innerAccess.getName(); // e.g. balances

        const slot = this.lookupSlot(`${className}.${mappingName}`);
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
    return { kind: "call", target, args };
  }

  private lookupSlot(fqName: string): number | undefined {
    return ctx.slotMap.get(fqName);
  }
}
