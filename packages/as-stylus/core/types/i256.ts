// ASCII constants
const ASCII_0: u8 = 0x30; // '0'
const ASCII_a: u8 = 0x61; // 'a'
const ASCII_X_LOWER: u8 = 0x78; // 'x'
const ASCII_CASE_MASK: u8 = 0x20; // toLower bit
const HEX_ALPHA_OFFSET: u8 = ASCII_a - 10; // 0x61-0x0A = 0x57

import { panicArithmeticOverflow } from "../modules/errors";
import { malloc } from "../modules/memory";

export class I256 {
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
  /** decimal string → I256 (supports negative numbers with '-' prefix) */
  static setFromString(dest: usize, str: usize, len: u32): void {
    let isNegative = false;
    let startIdx: u32 = 0;

    // Check for negative sign
    if (len > 0 && load<u8>(str) === 0x2d) {
      isNegative = true;
      startIdx = 1;
    }

    // Clear destination
    for (let i = 0; i < 32; ++i) store<u8>(dest + i, 0);

    // Parse digits
    for (let i: u32 = startIdx; i < len; ++i) {
      const digit: u8 = load<u8>(str + i) - ASCII_0;
      this.mul10(dest);
      this.addSmall(dest, digit);
    }

    // Apply two's complement if negative
    if (isNegative) {
      this.negate(dest);
    }
  }

  /** hexadecimal string → I256 (accepts "0x" prefix and negative with '-') */
  static setFromStringHex(dest: usize, str: usize, len: u32): void {
    let isNegative = false;
    let off: u32 = 0;

    // Check for negative sign
    if (len > 0 && load<u8>(str) === 0x2d) {
      // '-'
      isNegative = true;
      off = 1;
    }

    if (
      len >= off + 2 &&
      load<u8>(str + off) === ASCII_0 &&
      (load<u8>(str + off + 1) | ASCII_CASE_MASK) === ASCII_X_LOWER
    ) {
      off += 2;
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

    // Apply two's complement if negative
    if (isNegative) {
      this.negate(dest);
    }
  }

  /*──────────────────────────*
   *  Public arithmetic        *
   *──────────────────────────*/
  static add(a: usize, b: usize): usize {
    // Check for overflow before performing addition
    if (this.wouldOverflowOnAdd(a, b)) {
      panicArithmeticOverflow();
    }

    const result = this.create();
    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const sum: u16 = load<u8>(a + i) + load<u8>(b + i) + carry;
      store<u8>(result + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }
    return result;
  }

  static sub(a: usize, b: usize): usize {
    // Check for underflow before performing subtraction
    if (this.wouldUnderflowOnSub(a, b)) {
      panicArithmeticOverflow();
    }

    const result = this.create();
    let borrow: u8 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const d: u16 = load<u8>(a + i);
      const s: u16 = load<u8>(b + i) + borrow;
      if (d < s) {
        store<u8>(result + i, <u8>(d + 256 - s));
        borrow = 1;
      } else {
        store<u8>(result + i, <u8>(d - s));
        borrow = 0;
      }
    }
    return result;
  }

  /*──────────────────────────*
   *  Comparisons (signed)     *
   *──────────────────────────*/

  /** signed: a < b */
  static lessThan(a: usize, b: usize): bool {
    const signA: u8 = load<u8>(a) >> 7;
    const signB: u8 = load<u8>(b) >> 7;
    if (signA != signB) return signA == 1;

    for (let i: i32 = 0; i < 32; ++i) {
      const av = load<u8>(a + i);
      const bv = load<u8>(b + i);
      if (av < bv) return true;
      if (av > bv) return false;
    }
    return false;
  }

  static greaterThan(a: usize, b: usize): bool {
    const signA: u8 = load<u8>(a) >> 7;
    const signB: u8 = load<u8>(b) >> 7;
    if (signA != signB) return signA == 0;

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

  /*──────────────────────────*
   *  Sign helpers             *
   *──────────────────────────*/

  /** Check if number is negative (MSB = 1) */
  static isNegative(ptr: usize): bool {
    return load<u8>(ptr) >> 7 === 1;
  }

  /** Two's complement negation */
  static negate(ptr: usize): void {
    // Flip all bits
    for (let i = 0; i < 32; ++i) {
      store<u8>(ptr + i, ~load<u8>(ptr + i));
    }

    // Add 1
    let carry: u16 = 1;
    for (let i: i32 = 31; i >= 0 && carry; --i) {
      const sum: u16 = load<u8>(ptr + i) + carry;
      store<u8>(ptr + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }
  }

  /*──────────────────────────*
   *  Overflow detection       *
   *──────────────────────────*/

  /** Check if adding src to dest would cause signed overflow */
  static wouldOverflowOnAdd(dest: usize, src: usize): bool {
    const destSign = this.isNegative(dest);
    const srcSign = this.isNegative(src);

    // Only overflow when both operands have same sign
    if (destSign !== srcSign) return false;

    // Simulate addition to check for sign change
    const tempResult = this.create();
    this.copy(tempResult, dest);

    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const sum: u16 = load<u8>(tempResult + i) + load<u8>(src + i) + carry;
      store<u8>(tempResult + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }

    const resultSign = this.isNegative(tempResult);
    return destSign !== resultSign;
  }

  /** Check if subtracting src from dest would cause signed underflow */
  static wouldUnderflowOnSub(dest: usize, src: usize): bool {
    const destSign = this.isNegative(dest);
    const srcSign = this.isNegative(src);

    // Only underflow when operands have different signs
    if (destSign === srcSign) return false;

    // Simulate subtraction to check for sign change
    const tempResult = this.create();
    this.copy(tempResult, dest);

    let borrow: u8 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const d: u16 = load<u8>(tempResult + i);
      const s: u16 = load<u8>(src + i) + borrow;
      if (d < s) {
        store<u8>(tempResult + i, <u8>(d + 256 - s));
        borrow = 1;
      } else {
        store<u8>(tempResult + i, <u8>(d - s));
        borrow = 0;
      }
    }

    const resultSign = this.isNegative(tempResult);
    return destSign !== resultSign;
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

  // static fromI64(val: i64): usize {
  //   const ptr = malloc(32);
  //   const isNeg = val < 0;
  //   const absVal = isNeg ? <u64>-val : <u64>val;

  //   // Fill with 0x00 for positive, 0xFF for negative
  //   const fillByte: u8 = isNeg ? 0xff : 0x00;
  //   for (let i = 0; i < 24; ++i) store<u8>(ptr + i, fillByte);

  //   // Store the 64-bit value
  //   for (let i = 0; i < 8; ++i) {
  //     store<u8>(ptr + 31 - i, <u8>(absVal >> (8 * i)));
  //   }

  //   // Apply two's complement if negative
  //   if (isNeg) {
  //     this.negate(ptr);
  //   }

  //   return ptr;
  // }


  static copyNew(src: usize): usize {
    const dst = this.create();
    this.copy(dst, src);
    return dst;
  }

  /** Create I256 from U256 (direct copy, interprets as signed) */
  static fromU256(u256Ptr: usize): usize {
    const i256Ptr = this.create();
    this.copy(i256Ptr, u256Ptr);
    return i256Ptr;
  }

  /** Get absolute value as U256 */
  static abs(ptr: usize): usize {
    // If positive, return as U256 directly
    if (!this.isNegative(ptr)) {
      const u256Ptr = malloc(32);
      this.copy(u256Ptr, ptr);
      return u256Ptr;
    }

    // If negative, negate and return as U256
    const absPtr = this.copyNew(ptr);
    this.negate(absPtr);
    return absPtr;
  }

  /** Convert to decimal string */
  static toString(ptr: usize): string {
    // Handle zero case
    let isZero = true;
    for (let i = 0; i < 32; ++i) {
      if (load<u8>(ptr + i) !== 0) {
        isZero = false;
        break;
      }
    }
    if (isZero) return "0";

    // Handle negative numbers
    const isNeg = this.isNegative(ptr);
    const workPtr = isNeg ? this.abs(ptr) : this.copyNew(ptr);

    // Convert to string (simple approach - could be optimized)
    let result = "";
    while (!this.isZero(workPtr)) {
      const remainder = this.divMod10(workPtr);
      result = String.fromCharCode(remainder + 0x30) + result; // 0x30 = '0'
    }

    return isNeg ? "-" + result : result;
  }

  /** Check if value is zero */
  static isZero(ptr: usize): bool {
    for (let i = 0; i < 32; ++i) {
      if (load<u8>(ptr + i) !== 0) return false;
    }
    return true;
  }

  /** Divide by 10 and return remainder */
  static divMod10(ptr: usize): u8 {
    let remainder: u16 = 0;
    for (let i = 0; i < 32; ++i) {
      const dividend: u16 = (remainder << 8) | load<u8>(ptr + i);
      store<u8>(ptr + i, <u8>(dividend / 10));
      remainder = dividend % 10;
    }
    return <u8>remainder;
  }

  /** signed: a <= b */
  static lessThanOrEqual(a: usize, b: usize): bool {
    return this.lessThan(a, b) || this.equals(a, b);
  }

  /** signed: a >= b */
  static greaterThanOrEqual(a: usize, b: usize): bool {
    return this.greaterThan(a, b) || this.equals(a, b);
  }

  /** signed: a != b */
  static notEquals(a: usize, b: usize): bool {
    return !this.equals(a, b);
  }
}
