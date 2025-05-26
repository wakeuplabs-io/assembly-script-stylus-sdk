/******************************************************************
 * Address — low-level implementation (20-byte big-endian buffer) *
 ******************************************************************/

// ── ASCII constants ─────────────────────────────────────────────
const ASCII_0: u8          = 0x30;
const ASCII_a: u8          = 0x61;
const ASCII_X_LOWER: u8    = 0x78;
const ASCII_CASE_MASK: u8  = 0x20;
const HEX_ALPHA_OFFSET: u8 = ASCII_a - 10;

import { malloc } from "../modules/memory";

export class Address {

  /*──────────────────────────*
   *  Constructors             *
   *──────────────────────────*/
  
  static create(): usize {
    const ptr = malloc(20);
    for (let i: i32 = 0; i < 20; ++i) store<u8>(ptr + i, 0);
    return ptr;
  }

  static setFromString(dest: usize, str: usize, len: u32): void {
    let off: u32 = 0;
    if (
      len >= 2 &&
      load<u8>(str) == ASCII_0 &&
      (load<u8>(str + 1) | ASCII_CASE_MASK) == ASCII_X_LOWER
    ) {
      off = 2;
    }

    const nibs = len - off;
    const odd  = (nibs & 1) != 0;

    for (let i: i32 = 0; i < 20; ++i) store<u8>(dest + i, 0);

    let d: i32 = 19;
    let s: i32 = <i32>(off + nibs - 1);

    if (odd) {
      store<u8>(dest + d--, Address.hexChar(load<u8>(str + s--)));
    }
    while (d >= 0 && s >= (<i32>off + 1)) {
      const lo = Address.hexChar(load<u8>(str + s));
      const hi = Address.hexChar(load<u8>(str + s - 1));
      store<u8>(dest + d--, (hi << 4) | lo);
      s -= 2;
    }
  }

  static setFromU256(dest: usize, src256: usize): void {
    for (let i: i32 = 0; i < 20; ++i) {
      store<u8>(dest + i, load<u8>(src256 + 12 + i));
    }
  }

  /*──────────────────────────*
   *  Conversions / queries    *
   *──────────────────────────*/

  static isZero(ptr: usize): bool {
    for (let i: i32 = 0; i < 20; ++i) {
      if (load<u8>(ptr + i) != 0) return false;
    }
    return true;
  }

  static equals(a: usize, b: usize): bool {
    let diff: u8 = 0;
    for (let i: i32 = 0; i < 20; ++i) {
      diff |= load<u8>(a + i) ^ load<u8>(b + i);
    }
    return diff == 0;
  }

  static toString(ptr: usize): string {
    const out = new Array<u16>(42); // "0x" + 40 nibbles
    out[0] = 0x30; // '0'
    out[1] = 0x78; // 'x'

    for (let i: i32 = 0; i < 20; ++i) {
      const byte = load<u8>(ptr + i);
      out[2 + 2 * i]     = Address.hexNibble(byte >> 4);
      out[2 + 2 * i + 1] = Address.hexNibble(byte & 0x0F);
    }
    return String.fromCharCodes(out);
  }

  static toBytes20(ptr: usize): usize {
    return ptr;
  }

  static toU256(ptr: usize): usize {
    const u256 = malloc(32);
    for (let i: i32 = 0; i < 12; ++i) store<u8>(u256 + i, 0);
    for (let i: i32 = 0; i < 20; ++i) {
      store<u8>(u256 + 12 + i, load<u8>(ptr + i));
    }
    return u256;
  }

  static copy(dest: usize, src: usize): void {
    for (let i: i32 = 0; i < 20; ++i) store<u8>(dest + i, load<u8>(src + i));
  }

  /*──────────────────────────*
   *  Internal helpers         *
   *──────────────────────────*/

  private static hexNibble(v: u8): u16 {
    return <u16>(v < 10 ? ASCII_0 + v : ASCII_a + (v - 10));
  }

  private static hexChar(c: u8): u8 {
    const lo = c | ASCII_CASE_MASK;
    return lo >= ASCII_a
      ? lo - HEX_ALPHA_OFFSET
      : c - ASCII_0;
  }
}
