import { Address } from "./address";
import { Boolean } from "./boolean";
import { Str } from "./str";
import {
  storage_load_bytes32,
  storage_cache_bytes32,
  storage_flush_cache,
} from "../modules/hostio";
import { malloc } from "../modules/memory";
import { createStorageKey } from "../modules/storage";

// TODO: convert it to StructStorage
export class Struct {
  /**
   * Allocates and zero-initializes memory for a struct
   * @param sz - Size in bytes to allocate
   * @returns Pointer to the allocated memory
   */
  static alloc(sz: u32): usize {
    const p = malloc(sz);
    memory.fill(p, 0, sz);
    return p;
  }

  /**
   * Copies memory from source to destination
   * @param d - Destination pointer
   * @param s - Source pointer
   * @param sz - Size in bytes to copy
   */
  static copy(d: usize, s: usize, sz: u32): void {
    memory.copy(d, s, sz);
  }

  /**
   * Loads struct data from contract storage
   * @param ptr - Destination pointer
   * @param slot - Storage slot identifier
   */
  static loadFromStorage(ptr: usize, slot: u64): void {
    storage_load_bytes32(createStorageKey(slot), ptr);
  }

  /**
   * Stores struct data to contract storage
   * @param ptr - Source data pointer
   * @param slot - Storage slot identifier
   */
  static storeToStorage(ptr: usize, slot: u64): void {
    storage_cache_bytes32(createStorageKey(slot), ptr);
  }

  /**
   * Flushes cached storage operations
   */
  static flushStorage(): void {
    storage_flush_cache(0);
  }

  /**
   * Sets an address field in a struct and stores to storage
   * @param p - Struct pointer
   * @param v - Address value pointer
   * @param slot - Storage slot identifier
   */
  static setAddress(p: usize, v: usize, slot: u64): void {
    for (let i = 0; i < 32; i++) store<u8>(p + i, load<u8>(v + i));
    storage_cache_bytes32(createStorageKey(slot), p);
    storage_flush_cache(0);
  }

  static getAddress(slot: u64): usize {
    const out = malloc(32);
    storage_load_bytes32(createStorageKey(slot), out);
    return Address.copyNew(out);
  }

  /**
   * Sets a string field in a struct and stores to storage
   * @param ptr - Struct pointer
   * @param strObj - String object pointer
   * @param slot - Storage slot identifier
   */
  static setString(ptr: usize, strObj: usize, slot: u64): void {
    Str.storeTo(slot, strObj);
  }

  /**
   * Sets a U256 field and stores to storage
   * @param slot - Storage slot identifier
   * @param v - U256 value pointer
   */
  static setU256(slot: u64, v: usize): void {
    storage_cache_bytes32(createStorageKey(slot), v);
    storage_flush_cache(0);
  }

  /**
   * Sets a boolean field and stores to storage
   * @param slot - Storage slot identifier
   * @param v - Boolean value pointer
   */
  static setBoolean(slot: u64, v: usize): void {
    storage_cache_bytes32(createStorageKey(slot), v);
    storage_flush_cache(0);
  }

  /**
   * Retrieves a string from storage and converts to ABI format
   * @param slot - Storage slot identifier
   * @returns Pointer to ABI-encoded string data
   */
  static getString(slot: u64): usize {
    return Str.loadFrom(slot);
  }

  /**
   * Retrieves a U256 value from storage
   * @param slot - Storage slot identifier
   * @returns Pointer to the retrieved U256 value
   */
  static getU256(slot: u64): usize {
    const out = malloc(32);
    storage_load_bytes32(createStorageKey(slot), out);
    return out;
  }

  /**
   * Retrieves a boolean value from storage
   * @param slot - Storage slot identifier
   * @returns Pointer to the retrieved boolean value
   */
  static getBoolean(slot: u64): boolean {
    const out = malloc(32);
    storage_load_bytes32(createStorageKey(slot), out);
    return Boolean.fromABI(out);
  }
}
