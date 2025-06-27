/**
 * Utilities for handling storage in the IR-to-AssemblyScript transformation
 */

import { IRVariable } from "@/cli/types/ir.types.js";


function formatSlotName(slot: number): string {
  return `__SLOT${slot.toString(16).padStart(2, "0")}`;
}

export function slotConst(slot: number): string {
  return `const ${formatSlotName(slot)}: u64 = ${slot};`;
}

export function loadSimple(name: string, slot: number): string {
  return `
function load_${name}(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(${formatSlotName(slot)}), ptr);
  return ptr;
}`;
}

export function storeSimple(name: string, slot: number): string {
  return `
function store_${name}(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(${formatSlotName(slot)}), ptr);
  storage_flush_cache(0);
}`;
}

export function generateStorageImports(variables: IRVariable[], hasStructs: boolean = false): string {
  const lines: string[] = ['// eslint-disable-next-line import/namespace'];

  const hasSimple = variables.some(v => v.kind === "simple");
  const hasMapping = variables.some(v => v.kind === "mapping");
  const hasMapping2 = variables.some(v => v.kind === "mapping2");

  if (hasSimple) {
    lines.push(
      'import {',
      '  storage_load_bytes32,',
      '  storage_cache_bytes32,',
      '  storage_flush_cache,',
      '} from "as-stylus/core/modules/hostio";',
      'import { createStorageKey } from "as-stylus/core/modules/storage";',
      'import { Msg } from "as-stylus/core/types/msg";',
      'import { Boolean } from "as-stylus/core/types/boolean";',
      'import { addTopic, emitTopics } from "as-stylus/core/modules/events";',
    );
  }
  
  lines.push('import { malloc } from "as-stylus/core/modules/memory";');  
  lines.push('import { Address } from "as-stylus/core/types/address";');
  lines.push('import { U256 } from "as-stylus/core/types/u256";');
  lines.push('import { Str } from "as-stylus/core/types/str";');
  lines.push('import { Struct } from "as-stylus/core/types/struct";');
  lines.push('import { loadU32BE } from "as-stylus/core/modules/endianness";');

  if (hasMapping) {
    lines.push('import { Mapping } from "as-stylus/core/types/mapping";');
  }
  if (hasMapping2) {
    lines.push('import { Mapping2 } from "as-stylus/core/types/mapping2";');
  }
  
  if (hasStructs) {
    lines.push('import { Struct } from "as-stylus/core/types/struct";');
  }

  lines.push('');
  return lines.join("\n");
}

export function generateStorageHelpers(variables: IRVariable[], structs: any[] = []): string[] {
  const lines: string[] = [];

  // Crear un mapa de structs por nombre para lookup rápido
  const structMap = new Map(structs.map(s => [s.name, s]));

  for (const v of variables) {
    lines.push(slotConst(v.slot));

    if (v.kind === "simple") {
      if (v.type === "string" || v.type === "Str") {
        lines.push(`
function load_${v.name}(): usize {
  return Str.loadFrom(${formatSlotName(v.slot)});
}

function store_${v.name}(strPtr: usize): void {
  Str.storeTo(${formatSlotName(v.slot)}, strPtr);
}`.trim());
      } else if (structMap.has(v.type)) {
        // Es un struct - generar versión multi-slot
        const struct = structMap.get(v.type);
        const numSlots = Math.ceil(struct.size / 32);
        
        // Load function para struct
        let loadBody = `  const ptr = Struct.alloc(${struct.size});`;
        for (let i = 0; i < numSlots; i++) {
          const slotValue = v.slot + i;
          const slotName = formatSlotName(slotValue);
          const offset = i * 32;
          loadBody += `\n  Struct.loadFromStorage(ptr${offset > 0 ? ` + ${offset}` : ''}, ${slotName});`;
        }
        loadBody += `\n  return ptr;`;
        
        lines.push(`
function load_${v.name}(): usize {
${loadBody}
}`);

        // Store function para struct  
        let storeBody = '';
        for (let i = 0; i < numSlots; i++) {
          const slotValue = v.slot + i;
          const slotName = formatSlotName(slotValue);
          const offset = i * 32;
          storeBody += `  Struct.storeToStorage(ptr${offset > 0 ? ` + ${offset}` : ''}, ${slotName});\n`;
        }
        storeBody += `  Struct.flushStorage();`;
        
        lines.push(`
function store_${v.name}(ptr: usize): void {
${storeBody}
}`);
      } else {
        lines.push(loadSimple(v.name, v.slot));
        lines.push(storeSimple(v.name, v.slot));
      }
    }
  }

  return lines;
}
