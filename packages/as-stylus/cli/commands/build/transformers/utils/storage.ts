/**
 * Utilities for handling storage in the IR-to-AssemblyScript transformation
 */

// Constants for imports
export const IMPORT_BLOCK = [
  "import { U256 } from '../../../as-stylus/core/types/u256';",
  "import { malloc } from '../../../as-stylus/core/modules/memory';",
  "import { createStorageKey } from '../../../as-stylus/core/modules/storage';",
  "import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from '../../../as-stylus/core/modules/hostio';",
  "",
].join("\n");

// Slot constant generator
export function slotConst(idx: number): string {
  return `const __SLOT${idx.toString(16).padStart(2, "0")}: u64 = ${idx};`;
}

// Load function generator
export function loadFn(name: string, slotIdx: number): string {
  return `
function load_${name}(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(__SLOT${slotIdx
    .toString(16)
    .padStart(2, "0")}), ptr);
  return ptr;
}`;
}

// Store function generator
export function storeFn(name: string, slotIdx: number): string {
  return `
function store_${name}(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(__SLOT${slotIdx
    .toString(16)
    .padStart(2, "0")}), ptr);
  storage_flush_cache(0);
}`;
}
