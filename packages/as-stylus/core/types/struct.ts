import { Boolean } from "./boolean";
import { Str } from "./str";
import { storeU32BE, loadU32BE } from "../modules/endianness";
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "../modules/hostio";
import { malloc } from "../modules/memory";
import { createStorageKey } from "../modules/storage";

export class Struct {
  /*──────── Memory ops ────────*/
  static alloc(sz: u32): usize {
    const p = malloc(sz);
    memory.fill(p, 0, sz);
    return p;
  }
  static copy(d: usize, s: usize, sz: u32): void {
    memory.copy(d, s, sz);
  }
  static getField(ptr: usize, off: u32): usize {
    return ptr + off;
  }

  /*──────── Storage ops ───────*/
  static loadFromStorage(ptr: usize, slot: u64): void {
    storage_load_bytes32(createStorageKey(slot), ptr);
  }
  static storeToStorage(ptr: usize, slot: u64): void {
    storage_cache_bytes32(createStorageKey(slot), ptr);
  }
  static flushStorage(): void {
    storage_flush_cache(0);
  }

  /*──────── Type-specific setters ─────*/
  static setAddress(p: usize, v: usize, slot: u64): void {
    for (let i = 0; i < 32; i++) store<u8>(p + i, load<u8>(v + i));
    storage_cache_bytes32(createStorageKey(slot), p);
  }

  static setString(ptr: usize, strObj: usize, slot: u64): void {
    Str.storeTo(slot, strObj);
    // Clear the entire 32-byte slot first
    for (let i = 0; i < 32; i++) store<u8>(ptr + i, 0);
    // Store the string object pointer as big-endian in the last 4 bytes
    storeU32BE(ptr + 28, strObj as u32);
  }

  /**
   * Creates a struct with proper ABI encoding for return values.
   * This manually constructs the full ABI layout including dynamic data.
   * @param structPtr Base struct pointer (will be modified in place)
   * @param stringFieldOffset Offset of the string field in the struct (e.g., 32 for second field)
   * @param stringABIBlob Pointer to the string in ABI format (from getString())
   * @returns Total size of the encoded struct
   */
  static encodeStructForABI(structPtr: usize, stringFieldOffset: u32, stringABIBlob: usize): u32 {
    const baseSize: u32 = 160; // 5 fields * 32 bytes each

    // Set the string field to point to offset 160 (after the header)
    for (let i = 0; i < 32; i++) store<u8>(structPtr + stringFieldOffset + i, 0);
    storeU32BE(structPtr + stringFieldOffset + 28, baseSize);

    // Get string length from the ABI blob (it's at offset 0x20 + 28 in the ABI format)
    const strLen: u32 = loadU32BE(stringABIBlob + 0x20 + 28);
    const paddedLen = (strLen + 31) & ~31;

    // Copy the string length to offset 160
    const stringDataPtr = structPtr + baseSize;
    for (let i = 0; i < 32; i++) store<u8>(stringDataPtr + i, 0);
    storeU32BE(stringDataPtr + 28, strLen);

    // Copy string content from ABI blob to offset 192 (160 + 32)
    const stringContentPtr = stringDataPtr + 32;
    for (let i: u32 = 0; i < paddedLen; i++) {
      store<u8>(stringContentPtr + i, load<u8>(stringABIBlob + 0x40 + i));
    }

    return baseSize + 32 + paddedLen; // Total size
  }

  static getString(slot: u64): usize {
    const strObj = Str.loadFrom(slot);
    return Str.toABI(strObj);
  }

  static getStringFromField(ptr: usize, offset: u32): usize {
    const stringPtr = load<usize>(ptr + offset);
    if (stringPtr != 0) {
      return Str.rawStringToABI(stringPtr);
    }
    return 0;
  }

  static setU256(p: usize, v: usize, slot: u64): void {
    memory.copy(p, v, 32);
    storage_cache_bytes32(createStorageKey(slot), p);
  }

  static setBoolean(p: usize, val: boolean, slot: u64): void {
    const bool = Boolean.create(val);
    memory.copy(p, bool, 32);
    storage_cache_bytes32(createStorageKey(slot), bool);
  }

  static getBoolean(ptr: usize, off: u32): usize {
    return Boolean.copyNew(ptr + off);
  }
}
