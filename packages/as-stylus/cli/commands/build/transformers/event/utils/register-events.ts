import { keccak256, stringToBytes } from "viem";

import { IREvent } from "@/cli/types/ir.types.js";

const EVENT_PREFIX = "__write_topic0_";

export function generateEventSignature(event: IREvent): string {
  const signature = `${event.name}(${event.fields.map(f => mapTypeToAbi(f.type)).join(",")})`;
  const hash = keccak256(stringToBytes(signature));
  return hash.slice(2);
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

export function registerEventTransformer(events: IREvent[]): string[] {
  const lines: string[] = [];

    for (const ev of events) {
      const hash = generateEventSignature(ev);
      const bytes: string[] = [];
      for (let i = 0; i < hash.length; i += 2) {
        bytes.push(`0x${hash.substring(i, i + 2)}`);
      }
      
      const fnName = `${EVENT_PREFIX}${ev.name}`;
      lines.push(`export function ${fnName}(dst: usize): void {`);
      for (let i = 0; i < bytes.length; i++) {
        lines.push(`  store<u8>(dst + ${i}, ${bytes[i]});`);
      }
      lines.push(`}`);
      lines.push("");
    }
  return lines;
}
