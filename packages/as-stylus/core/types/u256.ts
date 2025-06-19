// ASCII constants
const ASCII_0: u8 = 0x30; // '0'
const ASCII_a: u8 = 0x61; // 'a'
const ASCII_X_LOWER: u8 = 0x78; // 'x'
const ASCII_CASE_MASK: u8 = 0x20; // toLower bit
const HEX_ALPHA_OFFSET: u8 = ASCII_a - 10; // 0x61-0x0A = 0x57

import { malloc } from "../modules/memory";

export class U256 {
  /*──────────────────────────*
   *  Memory helpers           *
   *──────────────────────────*/
  static create(): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(ptr + i, 0);
    return ptr;
  }

  /** raw‐byte copy (src must already be a 32-byte big-endian buffer) */
  static copy(dest: usize, src: usize): void {
    for (let i = 0; i < 32; ++i) store<u8>(dest + i, load<u8>(src + i));
  }

  /*──────────────────────────*
   *  Constructors             *
   *──────────────────────────*/
  /** decimal string → U256 */
  static setFromString(dest: usize, str: usize, len: u32): void {
    for (let i = 0; i < 32; ++i) store<u8>(dest + i, 0);

    for (let i: u32 = 0; i < len; ++i) {
      const digit: u8 = load<u8>(str + i) - ASCII_0;
      this.mul10(dest);
      this.addSmall(dest, digit);
    }
  }

  /** hexadecimal string → U256 (accepts “0x” prefix) */
  static setFromStringHex(dest: usize, str: usize, len: u32): void {
    let off: u32 = 0;
    if (
      len >= 2 &&
      load<u8>(str) === ASCII_0 &&
      (load<u8>(str + 1) | ASCII_CASE_MASK) === ASCII_X_LOWER
    ) {
      off = 2;
    }

    const nibs = len - off;
    const odd = (nibs & 1) !== 0;

    for (let i = 0; i < 32; ++i) store<u8>(dest + i, 0);

    let d: i32 = 31;
    let s: i32 = <i32>(off + nibs - 1);

    if (odd) {
      store<u8>(dest + d--, this.hexChar(load<u8>(str + s--)));
    }
    while (d >= 0 && s >= <i32>off + 1) {
      const low = this.hexChar(load<u8>(str + s));
      const high = this.hexChar(load<u8>(str + s - 1));
      store<u8>(dest + d--, (high << 4) | low);
      s -= 2;
    }
  }

  /*──────────────────────────*
   *  Public arithmetic        *
   *──────────────────────────*/
  static add(dest: usize, src: usize): usize {
    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const sum: u16 = load<u8>(dest + i) + load<u8>(src + i) + carry;
      store<u8>(dest + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }
    return dest;
  }

  static sub(dest: usize, src: usize): usize {
    let borrow: u8 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const d: u16 = load<u8>(dest + i);
      const s: u16 = load<u8>(src + i) + borrow;
      if (d < s) {
        store<u8>(dest + i, <u8>(d + 256 - s));
        borrow = 1;
      } else {
        store<u8>(dest + i, <u8>(d - s));
        borrow = 0;
      }
    }
    return dest;
  }

  /*──────────────────────────*
   *  Comparisons            *
   *──────────────────────────*/

  /** unsigned: a < b */
  static lessThan(a: usize, b: usize): bool {
    for (let i: i32 = 0; i < 32; ++i) {
      const av = load<u8>(a + i);
      const bv = load<u8>(b + i);
      if (av < bv) return true;
      if (av > bv) return false;
    }
    return false;
  }

  static greaterThan(a: usize, b: usize): bool {
    for (let i: i32 = 0; i < 32; ++i) {
      const av = load<u8>(a + i);
      const bv = load<u8>(b + i);
      if (av > bv) return true;
      if (av < bv) return false;
    }
    return false;
  }

  static equals(a: usize, b: usize): bool {
    for (let i: i32 = 0; i < 32; ++i) {
      if (load<u8>(a + i) != load<u8>(b + i)) return false;
    }
    return true;
  }

  static lessThanSigned(a: usize, b: usize): bool {
    const signA: u8 = load<u8>(a) >> 7;
    const signB: u8 = load<u8>(b) >> 7;
    if (signA != signB) return signA == 1;
    return this.lessThan(a, b);
  }

  static greaterThanSigned(a: usize, b: usize): bool {
    const signA: u8 = load<u8>(a) >> 7;
    const signB: u8 = load<u8>(b) >> 7;
    if (signA != signB) return signA == 0;
    return this.greaterThan(a, b);
  }

  static equalsSigned(a: usize, b: usize): bool {
    return this.equals(a, b);
  }

  /*──────────────────────────*
   *  Internal helpers         *
   *──────────────────────────*/
  private static mul10(ptr: usize): void {
    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const prod: u16 = load<u8>(ptr + i) * 10 + carry;
      store<u8>(ptr + i, <u8>prod);
      carry = prod >> 8;
    }
  }

  private static addSmall(ptr: usize, val: u8): void {
    let carry: u16 = val;
    for (let i: i32 = 31; i >= 0 && carry; --i) {
      const sum: u16 = load<u8>(ptr + i) + carry;
      store<u8>(ptr + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }
  }

  private static hexChar(c: u8): u8 {
    const lo = c | ASCII_CASE_MASK;
    return lo >= ASCII_a ? lo - HEX_ALPHA_OFFSET : c - ASCII_0;
  }

  /** Construye un U256 a partir de un u64 (big-endian) */
  static fromU64(val: u64): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 24; ++i) store<u8>(ptr + i, 0);
    for (let i = 0; i < 8; ++i) store<u8>(ptr + 31 - i, <u8>(val >> (8 * i)));
    return ptr;
  }

  /** Devuelve una *copia* de `a + b` (no muta los argumentos) */
  static addNew(a: usize, b: usize): usize {
    const out = malloc(32);
    this.copy(out, a);
    this.add(out, b);
    return out;
  }
}
