import { Str } from "./str";
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
    for (let i = 0; i < 20; i++) store<u8>(p + i, load<u8>(v + i));
    for (let i = 20; i < 32; i++) store<u8>(p + i, 0);
    storage_cache_bytes32(createStorageKey(slot), p);
  }

  static setString(ptr: usize, strObj: usize, slot: u64): void {
    Str.storeTo(slot, strObj);
    store<usize>(ptr, strObj);
    for (let i = sizeof<usize>(); i < 32; i++) store<u8>(ptr + i, 0);
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
    store<u8>(p, val ? 1 : 0);
    for (let i = 1; i < 32; i++) store<u8>(p + i, 0);
    storage_cache_bytes32(createStorageKey(slot), p);
  }
}
