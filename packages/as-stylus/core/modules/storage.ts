import {
  native_keccak256,
  storage_cache_bytes32,
  storage_flush_cache,
  storage_load_bytes32,
} from "./hostio";
import { malloc } from "./memory";

/** Creates a 32-byte storage key from a u64 (BigEndian) */
export function createStorageKey(slot: u64): usize {
  const key = malloc(32);
  for (let i = 0; i < 24; i++) store<u8>(key + i, 0);
  for (let i = 0; i < 8; i++) store<u8>(key + 31 - i, <u8>(slot >> (8 * i)));
  return key;
}

export function createMappingKey(slot: u64, keyPtr: usize, keyLen: u32): usize {
  const buf: usize = malloc(64);
  for (let i = 0; i < 64; ++i) store<u8>(buf + i, 0);
  const keyOff: u32 = 32 - keyLen;
  for (let i: u32 = 0; i < keyLen; ++i) {
    store<u8>(buf + keyOff + i, load<u8>(keyPtr + i));
  }
  for (let i: u32 = 0; i < 8; ++i) {
    store<u8>(buf + 64 - 1 - i, <u8>(slot >> (8 * i)));
  }
  const out: usize = malloc(32);
  native_keccak256(buf, 64, out);
  return out;
}

export function mapLoad(slot: u64, keyPtr: usize, keyLen: u32, destPtr: usize): void {
  const skey = createMappingKey(slot, keyPtr, keyLen);
  storage_load_bytes32(skey, destPtr);
}

export function mapStore(slot: u64, keyPtr: usize, keyLen: u32, srcPtr: usize): void {
  const skey = createMappingKey(slot, keyPtr, keyLen);
  storage_cache_bytes32(skey, srcPtr);
  storage_flush_cache(0);
}

export function mapStoreHash(slotPtr: usize, keyPtr: usize, keyLen: u32, srcPtr: usize): void {
  const buf: usize = malloc(64);
  memory.copy(buf + (32 - keyLen), keyPtr, keyLen);
  memory.copy(buf + 32, slotPtr, 32);

  const out: usize = malloc(32);
  native_keccak256(buf, 64, out);

  storage_cache_bytes32(out, srcPtr);
  storage_flush_cache(0);
}

export function mapLoadHash(slotPtr: usize, keyPtr: usize, keyLen: u32, destPtr: usize): void {
  const buf: usize = malloc(64);
  memory.copy(buf + (32 - keyLen), keyPtr, keyLen);
  memory.copy(buf + 32, slotPtr, 32);

  const out: usize = malloc(32);
  native_keccak256(buf, 64, out);

  storage_load_bytes32(out, destPtr);
}
