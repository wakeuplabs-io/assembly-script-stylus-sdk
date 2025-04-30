import { malloc } from "../types/memory";
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "./hostio";

/** Creates a 32-byte storage key from a u64 (BigEndian) */
function createStorageKey(slot: u64): usize {
  const key = malloc(32);
  for (let i = 0; i < 24; i++) store<u8>(key + i, 0);
  for (let i = 0; i < 8; i++) store<u8>(key + 31 - i, <u8>(slot >> (8 * i)));
  return key;
}

/** Stores a u64 into storage at the given slot */
export function storeU64(slot: u64, value: u64): void {
  const key = createStorageKey(slot);
  const data = malloc(32);

  for (let i = 0; i < 24; i++) store<u8>(data + i, 0);
  for (let i = 0; i < 8; i++) store<u8>(data + 31 - i, <u8>(value >> (8 * i)));

  storage_cache_bytes32(key, data);
  storage_flush_cache(0);
}

/** Loads a u64 from storage at the given slot */
export function loadU64(slot: u64): u64 {
  const key = createStorageKey(slot);
  const data = malloc(32);
  storage_load_bytes32(key, data);

  let result: u64 = 0;
  for (let i = 0; i < 8; i++) {
    result |= (<u64>load<u8>(data + 31 - i)) << (8 * i);
  }
  return result;
}

/** Initializes a slot with value 0 */
export function initU64(slot: u64): void {
  storeU64(slot, 0);
}