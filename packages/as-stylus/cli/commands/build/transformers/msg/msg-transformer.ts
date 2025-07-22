import { EmitContext, EmitResult } from "../../../../types/emit.types.js";
import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";

// Interfaces para tipos de expresiones
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
    // Los siguientes parámetros son requeridos por la interfaz pero no los usamos
    // en este transformador concreto para msg.sender y similares
    _context: EmitContext,
    _emitExprFn: (expr: Expression, ctx: EmitContext) => EmitResult
  ): EmitResult {
    // Manejamos las diferentes propiedades de msg
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
          valueExpr: `/* Propiedad de msg no soportada: ${expr.property} */`
        };
    }
  }

  generateLoadCode(property: string): string {
    return `/* Load no aplicable para msg.${property} */`;
  }

  generateStoreCode(property: string, _valueExpr: string): string {
    return `/* Store no aplicable para msg.${property} */`;
  }
}

export const msgTransformer = new MsgTransformer();
registerTransformer(msgTransformer);
