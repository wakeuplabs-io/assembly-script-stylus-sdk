import { AbiType, AssemblyScriptType } from "@/cli/types/abi.types.js";
import { EmitContext, EmitResult } from "@/cli/types/emit.types.js";
import { IREvent } from "@/cli/types/ir.types.js";
import { getReturnSize } from "@/cli/utils/type-utils.js";

import { ExpressionHandler } from "../../core/interfaces.js";
import { makeTemp } from "../../utils/temp-factory.js";

export class EventEmitHandler implements ExpressionHandler {
  private eventsMap: Map<string, IREvent>;

  constructor(events: IREvent[]) {
    this.eventsMap = new Map(events.map(e => [e.name, e]));
  }

  canHandle(expr: any): boolean {
    return (
      expr.kind === "call" &&
      typeof expr.target === "string" &&
      expr.target.endsWith(".emit")
    );
  }

  handle(
    expr: any,
    ctx: EmitContext,
    emit: (e: any, c: EmitContext) => EmitResult
  ): EmitResult {
    const eventName = expr.target.replace(/\.emit$/, "");
    const meta = this.eventsMap.get(eventName);
    if (!meta) {
      return {
        setupLines: [],
        valueExpr: `/* Unknown event ${eventName} */`,
      };
    }

    const topicsTemp = makeTemp("topics");
    const dataTemp   = makeTemp("data");
    const setup: string[] = [];

    // topic0 = keccak256("Transfer(address,address,uint256)")
    setup.push(`// topic0 for ${eventName}`);
    setup.push(`const ${topicsTemp}: usize = malloc(${meta.fields.filter(f=>f.indexed).length * 32 + 32});`);
    setup.push(`__write_topic0_${eventName}(${topicsTemp});`);
    let topicOffset = 32;
    const nonIndexed: string[] = [];

    meta.fields.forEach((field, i) => {
      const argExpr = emit(expr.args[i], ctx);
      setup.push(...argExpr.setupLines);
    
      if (field.indexed) {
        const size = getReturnSize(field.type as AbiType);
        if (field.type === AssemblyScriptType.Bool) {
          setup.push(`addTopic(${topicsTemp} + ${topicOffset}, Boolean.toABI(${argExpr.valueExpr}), ${size});`);
        } else {
          setup.push(`addTopic(${topicsTemp} + ${topicOffset}, ${argExpr.valueExpr}, ${size});`);
        }
        topicOffset += 32;
      } else {
        nonIndexed.push(argExpr.valueExpr);
      }
    });

    if (nonIndexed.length) {
      setup.push(`const ${dataTemp}: usize = malloc(${nonIndexed.length * 32});`);
      nonIndexed.forEach((ptr, idx) => {
        const field = meta.fields.filter(f => !f.indexed)[idx];
        if (field.type === AssemblyScriptType.Bool) {
          setup.push(`U256.copy(${dataTemp} + ${idx * 32}, Boolean.toABI(${ptr}));`);
        } else {
          setup.push(`U256.copy(${dataTemp} + ${idx * 32}, ${ptr});`);
        }
      });
    } else {
      setup.push(`const ${dataTemp}: usize = 0; // no data`);
    }

    const topicCount = meta.fields.filter(f => f.indexed).length + 1;
    setup.push(
      `emitTopics(${topicsTemp}, ${topicCount}, ${dataTemp}, ${nonIndexed.length * 32});`
    );

    return {
      setupLines: setup,
      valueExpr: "/* Event emitted */",
    };
  }
}
