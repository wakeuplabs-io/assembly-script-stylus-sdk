const ASCII_0: u8 = 0x30;
const ASCII_a: u8 = 0x61;
const ASCII_X_LOWER: u8 = 0x78;
const ASCII_CASE_MASK: u8 = 0x20;
const HEX_ALPHA_OFFSET: u8 = ASCII_a - 10;

import { panicArithmeticOverflow } from "../modules/errors";
import { malloc } from "../modules/memory";

export class I256 {
  /**
   * Creates a new zero-initialized I256 instance
   * @returns Pointer to the newly allocated I256
   */
  static create(): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(ptr + i, 0);
    return ptr;
  }

  /**
   * Creates a copy of an existing I256 instance
   * @param src - Pointer to source I256
   * @returns Pointer to the newly allocated I256 copy
   */
  static copy(src: usize): usize {
    const dest = this.create();
    for (let i = 0; i < 32; ++i) store<u8>(dest + i, load<u8>(src + i));
    return dest;
  }

  /**
   * Creates an I256 from a 64-bit signed integer
   * @param val - The i64 value to convert
   * @returns Pointer to the newly allocated I256
   */
  static fromI64(val: i64): usize {
    const ptr = this.create();
    const isNeg = val < 0;
    const absVal = isNeg ? <u64>-val : <u64>val;

    const fillByte: u8 = isNeg ? 0xff : 0x00;
    for (let i = 0; i < 24; ++i) store<u8>(ptr + i, fillByte);

    for (let i = 0; i < 8; ++i) {
      store<u8>(ptr + 31 - i, <u8>(absVal >> (8 * i)));
    }

    if (isNeg) {
      this.negateInPlace(ptr);
    }

    return ptr;
  }

  /**
   * Creates an I256 from a decimal string representation
   * @param str - Pointer to string data
   * @param len - Length of the string
   * @returns Pointer to the newly allocated I256
   */
  static fromString(str: usize, len: u32): usize {
    const result = this.create();
    let isNegative = false;
    let startIdx: u32 = 0;

    if (len > 0 && load<u8>(str) === 0x2d) {
      isNegative = true;
      startIdx = 1;
    }

    for (let i: u32 = startIdx; i < len; ++i) {
      const digit: u8 = load<u8>(str + i) - ASCII_0;
      this.mul10InPlace(result);
      this.addSmallInPlace(result, digit);
    }

    if (isNegative) {
      this.negateInPlace(result);
    }

    return result;
  }

  /**
   * Creates an I256 from a hexadecimal string representation
   * @param str - Pointer to string data (accepts "0x" prefix)
   * @param len - Length of the string
   * @returns Pointer to the newly allocated I256
   */
  static fromStringHex(str: usize, len: u32): usize {
    const result = this.create();
    let isNegative = false;
    let off: u32 = 0;

    if (len > 0 && load<u8>(str) === 0x2d) {
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

    let d: i32 = 31;
    let s: i32 = <i32>(off + nibs - 1);

    if (odd) {
      store<u8>(result + d--, this.hexChar(load<u8>(str + s--)));
    }
    while (d >= 0 && s >= <i32>off + 1) {
      const low = this.hexChar(load<u8>(str + s));
      const high = this.hexChar(load<u8>(str + s - 1));
      store<u8>(result + d--, (high << 4) | low);
      s -= 2;
    }

    if (isNegative) {
      this.negateInPlace(result);
    }

    return result;
  }

  /**
   * Adds two I256 values with overflow checking (panics on overflow)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result I256
   */
  static add(a: usize, b: usize): usize {
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

  /**
   * Subtracts two I256 values with overflow checking (panics on overflow)
   * @param a - Minuend pointer
   * @param b - Subtrahend pointer
   * @returns Pointer to the result I256
   */
  static sub(a: usize, b: usize): usize {
    if (this.wouldOverflowOnSub(a, b)) {
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

  /**
   * Multiplies two I256 values with overflow checking (panics on overflow)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result I256
   */
  static mul(a: usize, b: usize): usize {
    const result = this.mulUnchecked(a, b);
    
    if (this.wouldOverflowOnMul(a, b)) {
      panicArithmeticOverflow();
    }
    
    return result;
  }

  /**
   * Divides two I256 values with division-by-zero checking (panics on division by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result I256
   */
  static div(dividend: usize, divisor: usize): usize {
    if (this.isZero(divisor)) {
      panicArithmeticOverflow();
    }

    const isNegResult = this.isNegative(dividend) !== this.isNegative(divisor);
    const absDividend = this.abs(dividend);
    const absDivisor = this.abs(divisor);

    const result = this.divUnsigned(absDividend, absDivisor);

    if (isNegResult && !this.isZero(result)) {
      this.negateInPlace(result);
    }

    return result;
  }

  /**
   * Computes modulo of two I256 values with division-by-zero checking (panics on modulo by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result I256
   */
  static mod(dividend: usize, divisor: usize): usize {
    if (this.isZero(divisor)) {
      panicArithmeticOverflow();
    }

    const isNegDividend = this.isNegative(dividend);
    const absDividend = this.abs(dividend);
    const absDivisor = this.abs(divisor);

    const result = this.modUnsigned(absDividend, absDivisor);

    if (isNegDividend && !this.isZero(result)) {
      this.negateInPlace(result);
    }

    return result;
  }

  /**
   * Adds two I256 values with wrapping behavior (no overflow check)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result I256
   */
  static addUnchecked(a: usize, b: usize): usize {
    const result = this.create();
    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const sum: u16 = load<u8>(a + i) + load<u8>(b + i) + carry;
      store<u8>(result + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }
    return result;
  }

  /**
   * Subtracts two I256 values with wrapping behavior (no overflow check)
   * @param a - Minuend pointer
   * @param b - Subtrahend pointer
   * @returns Pointer to the result I256
   */
  static subUnchecked(a: usize, b: usize): usize {
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

  /**
   * Multiplies two I256 values with wrapping behavior (no overflow check)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result I256
   */
  static mulUnchecked(a: usize, b: usize): usize {
    const isNegA = this.isNegative(a);
    const isNegB = this.isNegative(b);
    const isNegResult = isNegA !== isNegB;

    const absA = this.abs(a);
    const absB = this.abs(b);
    const result = this.mulUnsigned(absA, absB);

    if (isNegResult && !this.isZero(result)) {
      this.negateInPlace(result);
    }

    return result;
  }

  /**
   * Divides two I256 values with wrapping behavior (returns 0 on division by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result I256
   */
  static divUnchecked(dividend: usize, divisor: usize): usize {
    if (this.isZero(divisor)) {
      return this.create();
    }

    return this.div(dividend, divisor);
  }

  /**
   * Computes modulo of two I256 values with wrapping behavior (returns 0 on modulo by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result I256
   */
  static modUnchecked(dividend: usize, divisor: usize): usize {
    if (this.isZero(divisor)) {
      return this.create();
    }

    return this.mod(dividend, divisor);
  }

  /**
   * Compares if first I256 is less than second I256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a < b, false otherwise
   */
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

  /**
   * Compares if first I256 is greater than second I256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a > b, false otherwise
   */
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

  /**
   * Compares if two I256 values are equal
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a == b, false otherwise
   */
  static equals(a: usize, b: usize): bool {
    for (let i: i32 = 0; i < 32; ++i) {
      if (load<u8>(a + i) != load<u8>(b + i)) return false;
    }
    return true;
  }

  /**
   * Compares if first I256 is less than or equal to second I256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a <= b, false otherwise
   */
  static lessThanOrEqual(a: usize, b: usize): bool {
    return this.lessThan(a, b) || this.equals(a, b);
  }

  /**
   * Compares if first I256 is greater than or equal to second I256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a >= b, false otherwise
   */
  static greaterThanOrEqual(a: usize, b: usize): bool {
    return this.greaterThan(a, b) || this.equals(a, b);
  }

  /**
   * Checks if the I256 value is negative
   * @param ptr - Pointer to the I256 value
   * @returns true if negative, false otherwise
   */
  static isNegative(ptr: usize): bool {
    return load<u8>(ptr) >> 7 === 1;
  }

  /**
   * Returns the negated value of an I256
   * @param ptr - Pointer to the I256 value
   * @returns Pointer to the negated I256
   */
  static negate(ptr: usize): usize {
    const result = this.copy(ptr);
    this.negateInPlace(result);
    return result;
  }

  /**
   * Returns the absolute value of an I256
   * @param ptr - Pointer to the I256 value
   * @returns Pointer to the absolute I256
   */
  static abs(ptr: usize): usize {
    if (!this.isNegative(ptr)) {
      return this.copy(ptr);
    }

    const result = this.copy(ptr);
    this.negateInPlace(result);
    return result;
  }

  /**
   * Checks if the I256 value is zero
   * @param ptr - Pointer to the I256 value
   * @returns true if zero, false otherwise
   */
  static isZero(ptr: usize): bool {
    for (let i = 0; i < 32; ++i) {
      if (load<u8>(ptr + i) !== 0) return false;
    }
    return true;
  }

  private static wouldOverflowOnAdd(a: usize, b: usize): bool {
    const signA = this.isNegative(a);
    const signB = this.isNegative(b);

    if (signA !== signB) return false;

    const tempResult = this.create();
    this.copyInPlace(tempResult, a);

    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const sum: u16 = load<u8>(tempResult + i) + load<u8>(b + i) + carry;
      store<u8>(tempResult + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }

    const resultSign = this.isNegative(tempResult);
    return signA !== resultSign;
  }

  private static wouldOverflowOnSub(a: usize, b: usize): bool {
    const signA = this.isNegative(a);
    const signB = this.isNegative(b);

    if (signA === signB) return false;

    const tempResult = this.create();
    this.copyInPlace(tempResult, a);

    let borrow: u8 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const d: u16 = load<u8>(tempResult + i);
      const s: u16 = load<u8>(b + i) + borrow;
      if (d < s) {
        store<u8>(tempResult + i, <u8>(d + 256 - s));
        borrow = 1;
      } else {
        store<u8>(tempResult + i, <u8>(d - s));
        borrow = 0;
      }
    }

    const resultSign = this.isNegative(tempResult);
    return signA !== resultSign;
  }

  private static wouldOverflowOnMul(a: usize, b: usize): bool {
    if (this.isZero(a) || this.isZero(b)) return false;

    const absA = this.abs(a);
    const absB = this.abs(b);
    
    const maxSafeValue = this.create();
    store<u8>(maxSafeValue, 0x7f);
    for (let i = 1; i < 32; ++i) store<u8>(maxSafeValue + i, 0xff);

    if (this.greaterThan(absA, maxSafeValue) || this.greaterThan(absB, maxSafeValue)) {
      return true;
    }

    const result = this.mulUnsigned(absA, absB);
    return this.greaterThan(result, maxSafeValue);
  }

  private static mulUnsigned(a: usize, b: usize): usize {
    const BYTES = 32;
    const result = this.create();
  
    for (let s = 0; s < BYTES; ++s) {
      const sb = load<u8>(b + (BYTES - 1 - s));
      if (!sb) continue;
  
      let carry: u32 = 0;
  
      for (let d = 0; d < BYTES; ++d) {
        const db  = load<u8>(a + (BYTES - 1 - d));
        const idx = BYTES - 1 - (s + d);
        const prod = <u32>db * sb + carry;
  
        if (idx < 0) {
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
    }
  
    return result;
  }

  private static divUnsigned(dividend: usize, divisor: usize): usize {
    const result = this.create();
    const remainder = this.create();
    const divisorCopy = this.copy(divisor);

    for (let i = 0; i < 256; ++i) {
      let carry: u16 = 0;
      for (let j = 31; j >= 0; --j) {
        const shifted = (load<u8>(remainder + j) << 1) | carry;
        store<u8>(remainder + j, <u8>shifted);
        carry = shifted >> 8;
      }

      const byteIndex = i >> 3;
      const bitIndex = i & 7;
      const bit = <u8>((load<u8>(dividend + byteIndex) >> (<u8>bitIndex)) & 1);
      if (bit) {
        store<u8>(remainder + 31, load<u8>(remainder + 31) | 1);
      }

      if (!this.lessThanUnsigned(remainder, divisorCopy)) {
        this.subInPlace(remainder, divisorCopy);
        const resultByteIndex = i >> 3;
        const resultBitIndex = i & 7;
        store<u8>(
          result + resultByteIndex,
          load<u8>(result + resultByteIndex) | (<u8>(1 << (<u8>resultBitIndex))),
        );
      }
    }

    return result;
  }

  private static modUnsigned(dividend: usize, divisor: usize): usize {
    if (this.lessThanUnsigned(dividend, divisor)) {
      return this.copy(dividend);
    }

    const result = this.copy(dividend);
    
    while (!this.lessThanUnsigned(result, divisor)) {
      this.subInPlace(result, divisor);
    }
    
    return result;
  }

  private static lessThanUnsigned(a: usize, b: usize): bool {
    for (let i: i32 = 0; i < 32; ++i) {
      const av = load<u8>(a + i);
      const bv = load<u8>(b + i);
      if (av < bv) return true;
      if (av > bv) return false;
    }
    return false;
  }

  private static negateInPlace(ptr: usize): void {
    for (let i = 0; i < 32; ++i) {
      store<u8>(ptr + i, ~load<u8>(ptr + i));
    }

    let carry: u16 = 1;
    for (let i: i32 = 31; i >= 0 && carry; --i) {
      const sum: u16 = load<u8>(ptr + i) + carry;
      store<u8>(ptr + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }
  }

  private static copyInPlace(dest: usize, src: usize): void {
    for (let i = 0; i < 32; ++i) store<u8>(dest + i, load<u8>(src + i));
  }

  private static subInPlace(dest: usize, src: usize): void {
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
  }

  private static mul10InPlace(ptr: usize): void {
    let carry: u16 = 0;
    for (let i: i32 = 31; i >= 0; --i) {
      const prod: u16 = load<u8>(ptr + i) * 10 + carry;
      store<u8>(ptr + i, <u8>prod);
      carry = prod >> 8;
    }
  }

  private static addSmallInPlace(ptr: usize, val: u8): void {
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
}