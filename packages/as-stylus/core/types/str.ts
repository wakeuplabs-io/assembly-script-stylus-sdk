import { U256 } from "./u256";
import { storeU32BE, loadU32BE } from "../modules/endianness";
import {
  storage_cache_bytes32,
  storage_load_bytes32,
  storage_flush_cache,
  native_keccak256,
} from "../modules/hostio";
import { malloc } from "../modules/memory";
import { createStorageKey } from "../modules/storage";

function zero(ptr: usize, len: u32): void {
  for (let i: u32 = 0; i < len; ++i) store<u8>(ptr + i, 0);
}

function min(a: u32, b: u32): u32 {
  return a < b ? a : b;
}

function loadU32FromBytes32(ptr: usize): u32 {
  return loadU32BE(ptr + 28);
}

export class Str {
  /**
   * Creates a new empty string
   * @returns Pointer to the newly allocated empty string
   */
  static create(): usize {
    const ptr = malloc(4);
    store<u32>(ptr, 0);
    return ptr;
  }

  /**
   * Creates a string from ABI-encoded data
   * @param pointer - Pointer to ABI-encoded string data
   * @returns Pointer to the newly created string
   */
  static fromABI(pointer: usize): usize {
    const len: u32 = loadU32BE(pointer + 0x20 + 28);
    const dataPtr = pointer + 0x40;
    return Str.fromBytes(dataPtr, len);
  }

  /**
   * Creates a string from an AssemblyScript string literal
   * @param str - AssemblyScript string literal
   * @returns Pointer to the newly created string
   */
  static fromString(str: string): usize {
    const ptr = malloc(str.length);
    for (let i: i32 = 0; i < str.length; ++i) store<u8>(ptr + i, str.charCodeAt(i));
    return Str.fromBytes(ptr, str.length);
  }

  /**
   * Creates a string from a byte array
   * @param src - Pointer to source byte data
   * @param len - Length of the byte data
   * @returns Pointer to the newly created string
   */
  static fromBytes(src: usize, len: u32): usize {
    const ptr = malloc(4 + len);
    store<u32>(ptr, len);
    for (let i: u32 = 0; i < len; ++i) store<u8>(ptr + 4 + i, load<u8>(src + i));
    return ptr;
  }

  /**
   * Creates a string from fixed-size argument data
   * @param argsPtr - Pointer to argument data
   * @returns Pointer to the newly created string
   */
  static fromArg(argsPtr: usize): usize {
    return Str.fromBytes(argsPtr, 32);
  }

  /**
   * Creates a string from dynamic ABI-encoded argument data
   * @param argStart - Pointer to start of arguments
   * @param current - Pointer to offset field
   * @returns Pointer to the newly created string
   */
  static fromDynamicArg(argStart: usize, current: usize): usize {
    const off = loadU32FromBytes32(current);
    const lenPtr = argStart + off;
    const len = loadU32FromBytes32(lenPtr);
    const dataPtr = lenPtr + 32;
    return Str.fromBytes(dataPtr, len);
  }

  /**
   * Converts string to AssemblyScript string for debugging
   * @param ptr - Pointer to the string
   * @returns AssemblyScript string representation
   */
  static toString(ptr: usize): string {
    const len = load<u32>(ptr);
    return String.UTF8.decodeUnsafe(ptr + 4, len, true);
  }

  /**
   * Returns the length of the string as a 32-byte value
   * @param ptr - Pointer to the string
   * @returns Pointer to 32-byte length representation
   */
  static length(ptr: usize): usize {
    const out = malloc(32);
    zero(out, 32);
    store<u32>(out + 28, load<u32>(ptr));
    return out;
  }

  /**
   * Creates a substring from the original string
   * @param ptr - Pointer to the original string
   * @param offset - Starting offset
   * @param len - Length of the substring
   * @returns Pointer to the newly created substring
   */
  static slice(ptr: usize, offset: usize, len: usize): usize {
    const original: u32 = load<u32>(ptr);
    if (offset + len > original) len = <usize>(original - offset);

    const out = malloc(4 + len);
    store<u32>(out, len);
    for (let i: usize = 0; i < len; ++i) store<u8>(out + 4 + i, load<u8>(ptr + 4 + offset + i));
    return out;
  }

  /**
   * Converts string to packed storage format (≤28 bytes)
   * @param ptr - Pointer to the string
   * @returns Pointer to packed 32-byte representation
   */
  static toPacked(ptr: usize): usize {
    const len: u32 = load<u32>(ptr);
    const buf = malloc(32);
    zero(buf, 32);

    const n = min(len, 28);
    for (let i: u32 = 0; i < n; ++i) store<u8>(buf + i, load<u8>(ptr + 4 + i));

    store<u32>(buf + 28, len);
    return buf;
  }

  /**
   * Creates string from packed storage format
   * @param buf - Pointer to packed 32-byte data
   * @returns Pointer to the newly created string
   */
  static fromPacked(buf: usize): usize {
    const len: u32 = load<u32>(buf + 28);
    const ptr = malloc(4 + len);
    store<u32>(ptr, len);
    for (let i: u32 = 0; i < len; ++i) store<u8>(ptr + 4 + i, load<u8>(buf + i));
    return ptr;
  }

  /**
   * Stores string to contract storage using Solidity-style layout
   * @param slot - Storage slot identifier
   * @param ptr - Pointer to the string to store
   */
  static storeTo(slot: u64, ptr: usize): void {
    const len: u32 = load<u32>(ptr);
    if (len <= 28) {
      const packed = Str.toPacked(ptr);
      storage_cache_bytes32(createStorageKey(slot), packed);
      storage_flush_cache(0);
      return;
    }

    const lenBuf = malloc(32);
    zero(lenBuf, 32);
    store<u32>(lenBuf + 28, len);
    storage_cache_bytes32(createStorageKey(slot), lenBuf);
    storage_flush_cache(0);

    const slotKey = createStorageKey(slot);
    const base = malloc(32);
    native_keccak256(slotKey, 32, base);

    let remaining = len;
    let off: u32 = 0;
    let chunk: u64 = 0;

    while (remaining > 0) {
      const size: u32 = remaining >= 32 ? 32 : remaining;
      const chunkBuf = malloc(32);
      zero(chunkBuf, 32);
      for (let i: u32 = 0; i < size; ++i) store<u8>(chunkBuf + i, load<u8>(ptr + 4 + off + i));

      const keyPtr: usize = U256.add(base, U256.fromU64(chunk));

      storage_cache_bytes32(keyPtr, chunkBuf);
      storage_flush_cache(0);

      remaining -= size;
      off += size;
      chunk += 1;
    }
  }

  /**
   * Loads string from contract storage using Solidity-style layout
   * @param slot - Storage slot identifier
   * @returns Pointer to the loaded string
   */
  static loadFrom(slot: u64): usize {
    const lenBuf = malloc(32);
    storage_load_bytes32(createStorageKey(slot), lenBuf);
    const len: u32 = load<u32>(lenBuf + 28);

    if (len <= 28) return Str.fromPacked(lenBuf);

    const ptr = malloc(4 + len);
    store<u32>(ptr, len);

    const slotKey = createStorageKey(slot);
    const base: usize = malloc(32);
    native_keccak256(slotKey, 32, base);

    let remaining = len;
    let off: u32 = 0;
    let chunk: u64 = 0;

    while (remaining > 0) {
      const size: u32 = remaining >= 32 ? 32 : remaining;
      const keyPtr: usize = U256.add(base, U256.fromU64(chunk));

      const chunkBuf = malloc(32);
      storage_load_bytes32(keyPtr, chunkBuf);

      for (let i: u32 = 0; i < size; ++i) store<u8>(ptr + 4 + off + i, load<u8>(chunkBuf + i));

      remaining -= size;
      off += size;
      chunk += 1;
    }

    return ptr;
  }

  /**
   * Converts string to ABI-encoded format
   * @param ptr - Pointer to the string
   * @returns Pointer to ABI-encoded data
   */
  static toABI(ptr: usize): usize {
    const len: u32 = load<u32>(ptr);
    const paddedLen = (len + 31) & ~31;
    const total = 0x40 + paddedLen;

    const out = malloc(total);

    zero(out, 32);
    store<u8>(out + 31, 0x20);
    zero(out + 0x20, 32);
    storeU32BE(out + 0x20 + 28, len);
    for (let i: u32 = 0; i < len; ++i) {
      store<u8>(out + 0x40 + i, load<u8>(ptr + 4 + i));
    }

    return out;
  }

  /**
   * Converts raw string pointer to ABI-encoded format
   * @param stringPtr - Pointer to raw string data
   * @returns Pointer to ABI-encoded data
   */
  static rawStringToABI(stringPtr: usize): usize {
    if (stringPtr == 0) {
      const out = malloc(0x40);
      zero(out, 32);
      store<u8>(out + 31, 0x20);
      zero(out + 0x20, 32);
      return out;
    }

    const len: u32 = load<u32>(stringPtr - 4);
    const paddedLen = (len + 31) & ~31;
    const total = 0x40 + paddedLen;

    const out = malloc(total);

    zero(out, 32);
    store<u8>(out + 31, 0x20);
    zero(out + 0x20, 32);
    storeU32BE(out + 0x20 + 28, len);

    for (let i: u32 = 0; i < len; ++i) {
      store<u8>(out + 0x40 + i, load<u8>(stringPtr + i));
    }

    return out;
  }
}