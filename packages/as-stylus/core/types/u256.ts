// ASCII constants
const ASCII_0: u8 = 0x30; // '0'
const ASCII_a: u8 = 0x61; // 'a'
const ASCII_X_LOWER: u8 = 0x78; // 'x'
const ASCII_CASE_MASK: u8 = 0x20; // toLower bit
const HEX_ALPHA_OFFSET: u8 = ASCII_a - 10; // 0x61-0x0A = 0x57

import { panicArithmeticOverflow } from "../modules/errors";
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
   *  Checked arithmetic       *
   *──────────────────────────*/

  /** Addition with overflow checking (Solidity 0.8.x behavior) */
  static addChecked(dest: usize, src: usize): usize {
    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const sum: u16 = load<u8>(dest + i) + load<u8>(src + i) + carry;
      store<u8>(dest + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }

    // Check for overflow: if final carry exists, we overflowed
    if (carry > 0) {
      panicArithmeticOverflow();
    }

    return dest;
  }

  /** Subtraction with underflow checking (Solidity 0.8.x behavior) */
  static subChecked(dest: usize, src: usize): usize {
    // Check if dest < src (would cause underflow)
    if (this.lessThan(dest, src)) {
      panicArithmeticOverflow();
    }

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

  static lessThanOrEqual(a: usize, b: usize): bool {
    return this.lessThan(a, b) || this.equals(a, b);
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


  static mul(dest: usize, src: usize): usize {
    const BYTES = 32;
    const result = this.create();
    let overflow = false;
  
    for (let s = 0; s < BYTES; ++s) {
      const sb = load<u8>(src + (BYTES - 1 - s));
      if (!sb) continue;
  
      let carry: u32 = 0;
  
      for (let d = 0; d < BYTES; ++d) {
        const db  = load<u8>(dest + (BYTES - 1 - d));
        const idx = BYTES - 1 - (s + d);
        const prod = <u32>db * sb + carry;
  
        if (idx < 0) {
          if (prod) overflow = true;
          carry = prod >> 8;
          continue;
        }
  
        const sum = (<u32>load<u8>(result + idx)) + prod;
        store<u8>(result + idx, <u8>sum);
        carry = sum >> 8;
      }
  
      for (let c = BYTES - 1 - (s + BYTES); carry && c >= 0; --c) {
        const sum = <u32>load<u8>(result + c) + carry;
        store<u8>(result + c, <u8>sum);
        carry = sum >> 8;
      }
      if (carry) overflow = true;
    }
  
    if (overflow) panicArithmeticOverflow();
  
    this.copy(dest, result);
    return dest;
  }
  
  


  static div(dest: usize, src: usize): usize {
    // Check for division by zero
    if (this.equals(src, this.create())) {
      panicArithmeticOverflow();
    }

    const result = this.create();
    const remainder = this.create();
    const divisor = this.create();
    this.copy(divisor, src);

    // Long division algorithm
    for (let i = 0; i < 256; ++i) {
      // Shift remainder left
      let carry: u16 = 0;
      for (let j = 31; j >= 0; --j) {
        const shifted = (load<u8>(remainder + j) << 1) | carry;
        store<u8>(remainder + j, <u8>shifted);
        carry = shifted >> 8;
      }

      // Get bit from dividend
      const byteIndex = i >> 3;
      const bitIndex = i & 7;
      const bit = <u8>((load<u8>(dest + byteIndex) >> (<u8>bitIndex)) & 1);
      if (bit) {
        store<u8>(remainder + 31, load<u8>(remainder + 31) | 1);
      }

      // Compare remainder with divisor
      if (!this.lessThan(remainder, divisor)) {
        this.sub(remainder, divisor);
        // Set bit in result
        const resultByteIndex = i >> 3;
        const resultBitIndex = i & 7;
        store<u8>(
          result + resultByteIndex,
          load<u8>(result + resultByteIndex) | (<u8>(1 << (<u8>resultBitIndex))),
        );
      }
    }

    this.copy(dest, result);
    return dest;
  }

  static mod(dest: usize, src: usize): usize {
    // Check for modulo by zero
    if (this.equals(src, this.create())) {
      panicArithmeticOverflow();
    }

    const quotient = this.create();
    this.copy(quotient, dest);
    this.div(quotient, src);
    this.mul(quotient, src);
    this.sub(dest, quotient);
    return dest;
  }

  static pow(dest: usize, exponent: usize): usize {
    const result = this.create();
    store<u8>(result + 31, 1); // result = 1

    const base = this.create();
    this.copy(base, dest);

    // Binary exponentiation
    for (let i = 0; i < 256; ++i) {
      const byteIndex = i >> 3;
      const bitIndex = i & 7;
      const bit = <u8>((load<u8>(exponent + byteIndex) >> (<u8>bitIndex)) & 1);

      if (bit) {
        this.mul(result, base);
      }

      this.mul(base, base);
    }

    this.copy(dest, result);
    return dest;
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

  static fromU64(val: u64): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 24; ++i) store<u8>(ptr + i, 0);
    for (let i = 0; i < 8; ++i) store<u8>(ptr + 31 - i, <u8>(val >> (8 * i)));
    return ptr;
  }

  static addNew(a: usize, b: usize): usize {
    const out = malloc(32);
    this.copy(out, a);
    this.add(out, b);
    return out;
  }

  static addNewChecked(a: usize, b: usize): usize {
    const out = malloc(32);
    this.copy(out, a);
    this.addChecked(out, b);
    return out;
  }

  static subNewChecked(a: usize, b: usize): usize {
    const out = malloc(32);
    this.copy(out, a);
    this.subChecked(out, b);
    return out;
  }

  static copyNew(src: usize): usize {
    const dst = this.create();
    this.copy(dst, src);
    return dst;
  }
}
