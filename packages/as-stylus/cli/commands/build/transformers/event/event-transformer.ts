import keccak256 from "keccak256";

import { IREvent } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer, registerTransformer } from "../core/base-transformer.js";
import { EventEmitHandler } from "./handlers/emit-handler.js";


export class EventTransformer extends BaseTypeTransformer {
  private events: IREvent[];

  constructor(events: IREvent[]) {
    super("Event");
    this.events = events;
    this.registerHandler(new EventEmitHandler(events));
  }

  matchesType(expr: any): boolean {
    return (
      expr.kind === "call" &&
      typeof expr.target === "string" &&
      expr.target.endsWith(".emit")
    );
  }

  protected handleDefault() {
    return {
      setupLines: [],
      valueExpr: "/* unsupported event emit */",
    };
  }
  
  generateLoadCode(_property: string): string {
    return `/* Events do not support load operations */`;
  }
  
  generateStoreCode(_property: string, _valueExpr: string): string {
    return `/* Events do not support store operations */`;
  }
}

export function generateEventSignature(event: IREvent): string {
  const signature = `${event.name}(${event.fields.map(f => mapTypeToAbi(f.type)).join(",")})`;
  const hash = keccak256(signature).toString('hex');
  return hash;
}

export function registerEventTransformer(events: IREvent[]): string[] {
  const instance = new EventTransformer(events);
  registerTransformer(instance);

  const lines: string[] = [];

  for (const ev of events) {
    const hash = generateEventSignature(ev);
    const bytes: string[] = [];
    for (let i = 0; i < hash.length; i += 2) {
      bytes.push(`0x${hash.substring(i, i + 2)}`);
    }
    
    const fnName = `__write_topic0_${ev.name}`;
    lines.push(`export function ${fnName}(dst: usize): void {`);
    for (let i = 0; i < bytes.length; i++) {
      lines.push(`  store<u8>(dst + ${i}, ${bytes[i]});`);
    }
    lines.push(`}`);
    lines.push("");
  }

  return lines;
}

function mapTypeToAbi(type: string): string {
  switch (type) {
    case "U256": return "uint256";
    case "Address": return "address";
    case "boolean": return "bool";
    case "string": return "string";
    case "u64": return "uint64";
    default: return type;
  }
}