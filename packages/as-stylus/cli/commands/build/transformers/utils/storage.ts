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

export function generateStorageImports(variables: IRVariable[]): string {
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
      'import { allocBool } from "as-stylus/core/types/boolean";',
      'import { addTopic, emitTopics } from "as-stylus/core/modules/events";',
    );
  }
  
  lines.push('import { Address } from "as-stylus/core/types/address";');
  lines.push('import { U256 } from "as-stylus/core/types/u256";');
  lines.push('import { Str } from "as-stylus/core/types/str";');
  lines.push('import { loadU32BE } from "as-stylus/core/modules/endianness";');

  if (hasMapping) {
    lines.push('import { Mapping } from "as-stylus/core/types/mapping";');
  }
  if (hasMapping2) {
    lines.push('import { Mapping2 } from "as-stylus/core/types/mapping2";');
  }

  lines.push('');
  return lines.join("\n");
}

export function generateStorageHelpers(variables: IRVariable[]): string[] {
  const lines: string[] = [];

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
      } else {
        lines.push(loadSimple(v.name, v.slot));
        lines.push(storeSimple(v.name, v.slot));
      }
    }
  }

  return lines;
}
