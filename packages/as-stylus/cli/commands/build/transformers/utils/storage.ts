import { AbiType } from "@/cli/types/abi.types.js";
import { IRContract, IRStruct, IRVariable } from "@/cli/types/ir.types.js";


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

export function generateImports(contract: IRContract): string {
  const lines: string[] = ['// eslint-disable-next-line import/namespace'];

  const types = contract.symbolTable.getTypes();
  const hasStructs = contract.structs && contract.structs.length > 0;
  const hasEvents = contract.events && contract.events.length > 0;
  const hasErrors = contract.errors && contract.errors.length > 0;

  if (types.size === 0) {
    return '';
  }

  const hasSimple = types.has(AbiType.String) || types.has(AbiType.Bool) || types.has(AbiType.Address) || types.has(AbiType.Uint256);

  if (hasSimple) {
    lines.push(
      'import {',
      '  storage_load_bytes32,',
      '  storage_cache_bytes32,',
      '  storage_flush_cache,',
      '} from "as-stylus/core/modules/hostio";',
      'import { createStorageKey } from "as-stylus/core/modules/storage";',
    );
  }

  if (hasErrors) {
    lines.push('import { abort_with_data } from "as-stylus/core/modules/errors";');
  }

  if (hasEvents) {
    lines.push('import { addTopic, emitTopics } from "as-stylus/core/modules/events";');
  }

  if (types.has(AbiType.Mapping)) {
    lines.push('import { Mapping } from "as-stylus/core/types/mapping";');
  }

  if (types.has(AbiType.Mapping2)) {
    lines.push('import { Mapping2 } from "as-stylus/core/types/mapping2";');
  }

  if (types.has(AbiType.Struct)) {
    lines.push('import { Struct } from "as-stylus/core/types/struct";');
  }

  if (types.has(AbiType.Bool)) {
    lines.push('import { Boolean } from "as-stylus/core/types/boolean";');
  }

  if (types.has(AbiType.Address)) {
    lines.push('import { Address } from "as-stylus/core/types/address";');
  }

  if (types.has(AbiType.Uint256)) {
    lines.push('import { U256 } from "as-stylus/core/types/u256";');
  }

  if (types.has(AbiType.String)) {
    lines.push('import { Str } from "as-stylus/core/types/str";');
    lines.push('import { loadU32BE } from "as-stylus/core/modules/endianness";');
  }

  lines.push('import { Msg } from "as-stylus/core/types/msg";');

  lines.push('');
  return lines.join("\n");
}

function generateStructStorageFunctions(variable: IRVariable, struct: IRStruct): string[] {
  const lines: string[] = [];
  const numSlots = Math.ceil(struct.size / 32);
  
  // Generate load function
  let loadBody = `  const ptr = Struct.alloc(${struct.size});`;
  for (let i = 0; i < numSlots; i++) {
    const slotValue = variable.slot + i;
    const slotName = formatSlotName(slotValue);
    const offset = i * 32;
    loadBody += `\n  Struct.loadFromStorage(ptr${offset > 0 ? ` + ${offset}` : ''}, ${slotName});`;
  }
  loadBody += `\n  return ptr;`;
  
  lines.push(`
function load_${variable.name}(): usize {
${loadBody}
}`);

  // Generate store function
  let storeBody = '';
  for (let i = 0; i < numSlots; i++) {
    const slotValue = variable.slot + i;
    const slotName = formatSlotName(slotValue);
    const offset = i * 32;
    storeBody += `  Struct.storeToStorage(ptr${offset > 0 ? ` + ${offset}` : ''}, ${slotName});\n`;
  }
  storeBody += `  Struct.flushStorage();`;
  
  lines.push(`
function store_${variable.name}(ptr: usize): void {
${storeBody}
}`);

  return lines;
}

export function generateStorageHelpers(variables: IRVariable[], structs: IRStruct[] = []): string[] {
  const lines: string[] = [];
  const structMap = new Map(structs.map(s => [s.name, s]));

  for (const variable of variables) {
    lines.push(slotConst(variable.slot));

    if (variable.kind === "simple") {
      // Handle different types of simple variables
      switch (variable.type) {
        case AbiType.String:
          lines.push(`
function load_${variable.name}(): usize {
  return Str.loadFrom(${formatSlotName(variable.slot)});
}

function store_${variable.name}(strPtr: usize): void {
  Str.storeTo(${formatSlotName(variable.slot)}, strPtr);
}`.trim());
          break;

        case AbiType.Struct:
          if (variable.originalType && structMap.has(variable.originalType)) {
            const struct = structMap.get(variable.originalType);
            if (struct) {
              lines.push(...generateStructStorageFunctions(variable, struct));
            }
          } else {
            // Fallback to simple storage
            lines.push(loadSimple(variable.name, variable.slot));
            lines.push(storeSimple(variable.name, variable.slot));
          }
          break;

        default:
          // Handle other types with simple storage
          lines.push(loadSimple(variable.name, variable.slot));
          lines.push(storeSimple(variable.name, variable.slot));
          break;
      }
    }
  }

  return lines;
}
