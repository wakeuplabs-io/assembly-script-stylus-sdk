import { EmitContext, EmitResult } from "../../../../types/emit.types.js";
import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";

interface Expression {
  kind: string;
  [key: string]: unknown;
}

interface VarExpression extends Expression {
  kind: 'var';
  name: string;
}

interface MemberExpression extends Expression {
  kind: 'member';
  object: Expression;
  property: string;
}

export class MsgTransformer extends BaseTypeTransformer {
  constructor() {
    super("Msg");
  }

  matchesType(expr: Expression): boolean {
    return expr.kind === "member" && 
           (expr as MemberExpression).object?.kind === "var" && 
           ((expr as MemberExpression).object as VarExpression).name === "msg";
  }

  protected handleDefault(
    expr: MemberExpression,
    _context: EmitContext,
    _emitExprFn: (expr: Expression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    switch (expr.property) {
      case "sender":
        return { 
          setupLines: [], 
          valueExpr: "Msg.sender()" 
        };
      case "value":
        return { 
          setupLines: [], 
          valueExpr: "Msg.value()" 
        };
      default:
        return {
          setupLines: [],
          valueExpr: `/* Unsupported msg property: ${expr.property} */`
        };
    }
  }

  generateLoadCode(property: string): string {
    return `/* Unsupported msg property: ${property} */`;
  }
}

export const msgTransformer = new MsgTransformer();
registerTransformer(msgTransformer);
