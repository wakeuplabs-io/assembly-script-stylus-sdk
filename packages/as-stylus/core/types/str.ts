// as-stylus/core/types/str.ts
// ---------------------------------------------------------------------
// String wrapper — memory layout: [len: u32][bytes...]
// If len ≤ 28  → can be packed into a single slot (packed)
// If len > 28  → stored as a Solidity-style dynamic array
// ---------------------------------------------------------------------

import { U256 } from "./u256";
import { storeU32BE } from "../modules/endianness";
import {
  storage_cache_bytes32,
  storage_load_bytes32,
  storage_flush_cache,
  native_keccak256,
} from "../modules/hostio";
import { malloc } from "../modules/memory";
import { createStorageKey } from "../modules/storage";

// ————————————————————————————————————————————————————————————————————
// Utilidades internas
// ————————————————————————————————————————————————————————————————————
function zero(ptr: usize, len: u32): void {
  for (let i: u32 = 0; i < len; ++i) store<u8>(ptr + i, 0);
}

function min(a: u32, b: u32): u32 {
  return a < b ? a : b;
}

// ————————————————————————————————————————————————————————————————————
// Clase Str
// ————————————————————————————————————————————————————————————————————
export class Str {
  /* ────────────── Creación básica ────────────── */
  static create(): usize {
    const ptr = malloc(4);
    store<u32>(ptr, 0);
    return ptr;
  }

  /* Copia bytes crudos y los envuelve en formato [len][data] */
  static fromBytes(src: usize, len: u32): usize {
    const ptr = malloc(4 + len);
    store<u32>(ptr, len);
    for (let i: u32 = 0; i < len; ++i) store<u8>(ptr + 4 + i, load<u8>(src + i));
    return ptr;
  }

  /* Decodifica a string JS (solo para debugging - costoso) */
  static toString(ptr: usize): string {
    const len = load<u32>(ptr);
    return String.UTF8.decodeUnsafe(ptr + 4, len, true);
  }

  /* Devuelve la longitud empaquetada en U256 */
  static length(ptr: usize): usize {
    const out = malloc(32);
    zero(out, 32);
    store<u32>(out + 28, load<u32>(ptr));
    return out;
  }

  /* ────────────── Helpers de slicing en memoria ────────────── */
  static slice(ptr: usize, offset: usize, len: usize): usize {
    const original: u32 = load<u32>(ptr);
    if (offset + len > original) len = <usize>(original - offset);

    const out = malloc(4 + len);
    store<u32>(out, len);
    for (let i: usize = 0; i < len; ++i) store<u8>(out + 4 + i, load<u8>(ptr + 4 + offset + i));
    return out;
  }

  /* ────────────── Empaquetado en un slot (≤28 bytes) ────────────── */
  static toPacked(ptr: usize): usize {
    const len: u32 = load<u32>(ptr); // 0–28
    const buf = malloc(32);
    zero(buf, 32);

    const n = min(len, 28);
    for (let i: u32 = 0; i < n; ++i) store<u8>(buf + i, load<u8>(ptr + 4 + i));

    // longitud en los últimos 4 bytes (little-endian)
    store<u32>(buf + 28, len);
    return buf; // 32-byte block
  }

  static fromPacked(buf: usize): usize {
    const len: u32 = load<u32>(buf + 28);
    const ptr = malloc(4 + len);
    store<u32>(ptr, len);
    for (let i: u32 = 0; i < len; ++i) store<u8>(ptr + 4 + i, load<u8>(buf + i));
    return ptr;
  }

  /* ────────────── API de storage estilo Solidity ────────────── */
  static storeTo(slot: u64, ptr: usize): void {
    const len: u32 = load<u32>(ptr);

    // Caso 1 ─ packed (≤28)
    if (len <= 28) {
      const packed = Str.toPacked(ptr);
      storage_cache_bytes32(createStorageKey(slot), packed);
      storage_flush_cache(0);
      return;
    }

    // Caso 2 ─ dinámico (>28)
    // 1) slot base ← longitud
    const lenBuf = malloc(32);
    zero(lenBuf, 32);
    store<u32>(lenBuf + 28, len);
    storage_cache_bytes32(createStorageKey(slot), lenBuf);
    storage_flush_cache(0);

    // 2) keccak256(slot) → base key
    const slotKey = createStorageKey(slot);
    const base = malloc(32);
    native_keccak256(slotKey, 32, base);

    // 3) escribir chunks consecutivos
    let remaining = len;
    let off: u32 = 0;
    let chunk: u64 = 0;

    while (remaining > 0) {
      const size: u32 = remaining >= 32 ? 32 : remaining;
      const chunkBuf = malloc(32);
      zero(chunkBuf, 32);
      for (let i: u32 = 0; i < size; ++i) store<u8>(chunkBuf + i, load<u8>(ptr + 4 + off + i));

      const keyPtr = malloc(32);
      const keyVal: usize = U256.addNew(base, U256.fromU64(chunk));
      U256.copy(keyPtr, keyVal);

      storage_cache_bytes32(keyPtr, chunkBuf);
      storage_flush_cache(0);

      remaining -= size;
      off += size;
      chunk += 1;
    }
  }

  static loadFrom(slot: u64): usize {
    const lenBuf = malloc(32);
    storage_load_bytes32(createStorageKey(slot), lenBuf);
    const len: u32 = load<u32>(lenBuf + 28);

    // Caso 1 ─ packed
    if (len <= 28) return Str.fromPacked(lenBuf);

    // Caso 2 ─ dinámico
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
      const keyPtr = malloc(32);
      const keyVal: usize = U256.addNew(base, U256.fromU64(chunk));
      U256.copy(keyPtr, keyVal);

      const chunkBuf = malloc(32);
      storage_load_bytes32(keyPtr, chunkBuf);

      for (let i: u32 = 0; i < size; ++i) store<u8>(ptr + 4 + off + i, load<u8>(chunkBuf + i));

      remaining -= size;
      off += size;
      chunk += 1;
    }

    return ptr;
  }

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
}
