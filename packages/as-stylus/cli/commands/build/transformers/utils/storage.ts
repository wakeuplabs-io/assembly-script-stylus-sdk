import fs from "fs";
import path from "path";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRContract, IRStruct, IRVariable } from "@/cli/types/ir.types.js";

function formatSlotName(slot: number): string {
  return `__SLOT${slot.toString(16).padStart(2, "0")}`;
}

function getPackageName(): string {
  const cwd = process.cwd();
  const nodeModulesPath = path.join(cwd, "node_modules", "@wakeuplabs", "as-stylus");

  if (fs.existsSync(nodeModulesPath)) {
    return "@wakeuplabs/as-stylus";
  }

  return "as-stylus";
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
  const lines: string[] = ["// eslint-disable-next-line import/namespace"];
  const packageName = getPackageName();

  const types = contract.symbolTable.getTypes();
  const hasEvents = contract.events && contract.events.length > 0;
  const hasErrors = contract.errors && contract.errors.length > 0;

  if (types.size === 0) {
    return "";
  }

  const hasSimple =
    types.has(AbiType.String) ||
    types.has(AbiType.Bool) ||
    types.has(AbiType.Address) ||
    types.has(AbiType.Uint256);

  if (hasSimple) {
    lines.push(
      "import {",
      "  storage_load_bytes32,",
      "  storage_cache_bytes32,",
      "  storage_flush_cache,",
      `} from "${packageName}/core/modules/hostio";`,
      `import { createStorageKey } from "${packageName}/core/modules/storage";`,
    );
  }

  if (hasErrors) {
    lines.push(`import { abort_with_data } from "${packageName}/core/modules/errors";`);
  }

  if (hasEvents) {
    lines.push(`import { addTopic, emitTopics } from "${packageName}/core/modules/events";`);
  }

  if (types.has(AbiType.Mapping)) {
    lines.push(`import { Mapping } from "${packageName}/core/types/mapping";`);
  }

  if (types.has(AbiType.MappingNested)) {
    lines.push(`import { MappingNested } from "${packageName}/core/types/mapping2";`);
  }

  if (types.has(AbiType.Bool)) {
    lines.push(`import { Boolean } from "${packageName}/core/types/boolean";`);
  }

  if (types.has(AbiType.Address)) {
    lines.push(`import { Address } from "${packageName}/core/types/address";`);
  }

  if (types.has(AbiType.Uint256)) {
    lines.push(`import { U256 } from "${packageName}/core/types/u256";`);
  }

  if (types.has(AbiType.Int256)) {
    lines.push(`import { I256 } from "${packageName}/core/types/i256";`);
  }

  if (types.has(AbiType.String)) {
    lines.push(`import { Str } from "${packageName}/core/types/str";`);
    lines.push(`import { loadU32BE } from "${packageName}/core/modules/endianness";`);
  }

  const hasCallFactory = contract.methods.some(method => 
    method.ir.some((statement: any) => 
      JSON.stringify(statement).includes("CallFactory")
    )
  );

  if (hasCallFactory) {
    lines.push(`import { Calls } from "${packageName}/core/modules/calls";`);
  }

  lines.push(`import { Struct } from "${packageName}/core/types/struct";`);
  lines.push(`import { Msg } from "${packageName}/core/types/msg";`);
  lines.push(`import { malloc } from "${packageName}/core/modules/memory";`);
  lines.push(`import { DebugU256 } from "${packageName}/core/modules/debug";`);

  lines.push("");
  return lines.join("\n");
}

function generateStructStorageFunctions(variable: IRVariable, struct: IRStruct): string[] {
  const lines: string[] = [];
  const numSlots = Math.ceil(struct.size / 32);

  let loadBody = `  const ptr = Struct.alloc(${struct.size});`;
  for (let i = 0; i < numSlots; i++) {
    const slotValue = variable.slot + i;
    const slotName = formatSlotName(slotValue);
    const offset = i * 32;
    loadBody += `\n  Struct.loadFromStorage(ptr${offset > 0 ? ` + ${offset}` : ""}, ${slotName});`;
  }
  loadBody += `\n  return ptr;`;

  lines.push(`
function load_${variable.name}(): usize {
${loadBody}
}`);

  let storeBody = "";
  for (let i = 0; i < numSlots; i++) {
    const slotValue = variable.slot + i;
    const slotName = formatSlotName(slotValue);
    const offset = i * 32;
    storeBody += `  Struct.storeToStorage(ptr${offset > 0 ? ` + ${offset}` : ""}, ${slotName});\n`;
  }
  storeBody += `  Struct.flushStorage();`;

  lines.push(`
function store_${variable.name}(ptr: usize): void {
${storeBody}
}`);

  return lines;
}

export function generateStorageHelpers(
  variables: IRVariable[],
  structs: IRStruct[] = [],
): string[] {
  const lines: string[] = [];
  const structMap = new Map(structs.map((s) => [s.name, s]));

  for (const variable of variables) {
    lines.push(slotConst(variable.slot));

    if (variable.kind === "simple") {
      switch (variable.type) {
        case AbiType.String:
          lines.push(
            `
function load_${variable.name}(): usize {
  return Str.loadFrom(${formatSlotName(variable.slot)});
}

function store_${variable.name}(strPtr: usize): void {
  Str.storeTo(${formatSlotName(variable.slot)}, strPtr);
}`.trim(),
          );
          break;

        case AbiType.Struct:
          if (variable.originalType && structMap.has(variable.originalType)) {
            const struct = structMap.get(variable.originalType);
            if (struct) {
              lines.push(...generateStructStorageFunctions(variable, struct));
            }
          } else {
            lines.push(loadSimple(variable.name, variable.slot));
            lines.push(storeSimple(variable.name, variable.slot));
          }
          break;

        default:
          lines.push(loadSimple(variable.name, variable.slot));
          lines.push(storeSimple(variable.name, variable.slot));
          break;
      }
    }
  }

  return lines;
}
