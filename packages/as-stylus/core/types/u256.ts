const ASCII_0: u8 = 0x30;
const ASCII_a: u8 = 0x61;
const ASCII_X_LOWER: u8 = 0x78;
const ASCII_CASE_MASK: u8 = 0x20;
const HEX_ALPHA_OFFSET: u8 = ASCII_a - 10;

import { panicArithmeticOverflow } from "../modules/errors";
import { malloc } from "../modules/memory";

export class U256 {
  /**
   * Creates a new zero-initialized U256 instance
   * @returns Pointer to the newly allocated U256
   */
  static create(): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(ptr + i, 0);
    return ptr;
  }

  /**
   * Creates a copy of an existing U256 instance
   * @param src - Pointer to source U256
   * @returns Pointer to the newly allocated U256 copy
   */
  static copy(src: usize): usize {
    const dest = this.create();
    for (let i = 0; i < 32; ++i) store<u8>(dest + i, load<u8>(src + i));
    return dest;
  }

  /**
   * Creates a U256 from a 64-bit unsigned integer
   * @param val - The u64 value to convert
   * @returns Pointer to the newly allocated U256
   */
  static fromU64(val: u64): usize {
    const ptr = this.create();
    for (let i = 0; i < 8; ++i) store<u8>(ptr + 31 - i, <u8>(val >> (8 * i)));
    return ptr;
  }

  /**
   * Creates a U256 from a decimal string representation
   * @param str - Pointer to string data
   * @param len - Length of the string
   * @returns Pointer to the newly allocated U256
   */
  static fromString(str: usize, len: u32): usize {
    const result = this.create();
    
    for (let i: u32 = 0; i < len; ++i) {
      const digit: u8 = load<u8>(str + i) - ASCII_0;
      this.mul10InPlace(result);
      this.addSmallInPlace(result, digit);
    }
    
    return result;
  }

  /**
   * Creates a U256 from a hexadecimal string representation
   * @param str - Pointer to string data (accepts "0x" prefix)
   * @param len - Length of the string
   * @returns Pointer to the newly allocated U256
   */
  static fromStringHex(str: usize, len: u32): usize {
    const result = this.create();
    
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
    
    return result;
  }

  /**
   * Adds two U256 values with overflow checking (panics on overflow)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result U256
   */
  static add(a: usize, b: usize): usize {
    const result = this.create();
    let carry: u16 = 0;
    
    for (let i: i32 = 31; i >= 0; --i) {
      const sum: u16 = load<u8>(a + i) + load<u8>(b + i) + carry;
      store<u8>(result + i, <u8>sum);
      carry = sum > 0xff ? 1 : 0;
    }

    if (carry > 0) {
      panicArithmeticOverflow();
    }

    return result;
  }

  /**
   * Subtracts two U256 values with underflow checking (panics on underflow)
   * @param a - Minuend pointer
   * @param b - Subtrahend pointer
   * @returns Pointer to the result U256
   */
  static sub(a: usize, b: usize): usize {
    if (this.lessThan(a, b)) {
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
   * Multiplies two U256 values with overflow checking (panics on overflow)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result U256
   */
  static mul(a: usize, b: usize): usize {
    const BYTES = 32;
    const result = this.create();
    let overflow = false;
  
    for (let s = 0; s < BYTES; ++s) {
      const sb = load<u8>(b + (BYTES - 1 - s));
      if (!sb) continue;
  
      let carry: u32 = 0;
  
      for (let d = 0; d < BYTES; ++d) {
        const db  = load<u8>(a + (BYTES - 1 - d));
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
  
    if (overflow) {
      panicArithmeticOverflow();
    }
  
    return result;
  }

  /**
   * Divides two U256 values with division-by-zero checking (panics on division by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result U256
   */
  static div(dividend: usize, divisor: usize): usize {
    const zero = this.create();
    if (this.equals(divisor, zero)) {
      panicArithmeticOverflow();
    }

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

      if (!this.lessThan(remainder, divisorCopy)) {
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

  /**
   * Computes modulo of two U256 values with division-by-zero checking (panics on modulo by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result U256
   */
  static mod(dividend: usize, divisor: usize): usize {
    const zero = this.create();
    if (this.equals(divisor, zero)) {
      panicArithmeticOverflow();
    }

    if (this.lessThan(dividend, divisor)) {
      return this.copy(dividend);
    }

    const result = this.copy(dividend);
    
    while (!this.lessThan(result, divisor)) {
      this.subInPlace(result, divisor);
    }
    
    return result;
  }

  /**
   * Raises a U256 to the power of another U256 with overflow checking (panics on overflow)
   * @param base - Base pointer
   * @param exponent - Exponent pointer
   * @returns Pointer to the result U256
   */
  static pow(base: usize, exponent: usize): usize {
    const result = this.create();
    store<u8>(result + 31, 1);

    const baseCopy = this.copy(base);

    for (let i = 0; i < 256; ++i) {
      const byteIndex = i >> 3;
      const bitIndex = i & 7;
      const bit = <u8>((load<u8>(exponent + byteIndex) >> (<u8>bitIndex)) & 1);

      if (bit) {
        const newResult = this.mul(result, baseCopy);
        this.copyInPlace(result, newResult);
      }

      const newBase = this.mul(baseCopy, baseCopy);
      this.copyInPlace(baseCopy, newBase);
    }

    return result;
  }

  /**
   * Adds two U256 values with wrapping behavior (no overflow check)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result U256
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
   * Subtracts two U256 values with wrapping behavior (no underflow check)
   * @param a - Minuend pointer
   * @param b - Subtrahend pointer
   * @returns Pointer to the result U256
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
   * Multiplies two U256 values with wrapping behavior (no overflow check)
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns Pointer to the result U256
   */
  static mulUnchecked(a: usize, b: usize): usize {
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

  /**
   * Divides two U256 values with wrapping behavior (returns 0 on division by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result U256
   */
  static divUnchecked(dividend: usize, divisor: usize): usize {
    const zero = this.create();
    if (this.equals(divisor, zero)) {
      return zero;
    }

    return this.div(dividend, divisor);
  }

  /**
   * Computes modulo of two U256 values with wrapping behavior (returns 0 on modulo by zero)
   * @param dividend - Dividend pointer
   * @param divisor - Divisor pointer
   * @returns Pointer to the result U256
   */
  static modUnchecked(dividend: usize, divisor: usize): usize {
    const zero = this.create();
    if (this.equals(divisor, zero)) {
      return zero;
    }

    return this.mod(dividend, divisor);
  }

  /**
   * Raises a U256 to the power of another U256 with wrapping behavior (no overflow check)
   * @param base - Base pointer
   * @param exponent - Exponent pointer
   * @returns Pointer to the result U256
   */
  static powUnchecked(base: usize, exponent: usize): usize {
    const result = this.create();
    store<u8>(result + 31, 1);

    const baseCopy = this.copy(base);

    for (let i = 0; i < 256; ++i) {
      const byteIndex = i >> 3;
      const bitIndex = i & 7;
      const bit = <u8>((load<u8>(exponent + byteIndex) >> (<u8>bitIndex)) & 1);

      if (bit) {
        const newResult = this.mulUnchecked(result, baseCopy);
        this.copyInPlace(result, newResult);
      }

      const newBase = this.mulUnchecked(baseCopy, baseCopy);
      this.copyInPlace(baseCopy, newBase);
    }

    return result;
  }

  /**
   * Compares if first U256 is less than second U256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a < b, false otherwise
   */
  static lessThan(a: usize, b: usize): bool {
    for (let i: i32 = 0; i < 32; ++i) {
      const av = load<u8>(a + i);
      const bv = load<u8>(b + i);
      if (av < bv) return true;
      if (av > bv) return false;
    }
    return false;
  }

  /**
   * Compares if first U256 is greater than second U256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a > b, false otherwise
   */
  static greaterThan(a: usize, b: usize): bool {
    for (let i: i32 = 0; i < 32; ++i) {
      const av = load<u8>(a + i);
      const bv = load<u8>(b + i);
      if (av > bv) return true;
      if (av < bv) return false;
    }
    return false;
  }

  /**
   * Compares if two U256 values are equal
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
   * Compares if first U256 is less than or equal to second U256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a <= b, false otherwise
   */
  static lessThanOrEqual(a: usize, b: usize): bool {
    return this.lessThan(a, b) || this.equals(a, b);
  }

  /**
   * Compares if first U256 is greater than or equal to second U256
   * @param a - First operand pointer
   * @param b - Second operand pointer
   * @returns true if a >= b, false otherwise
   */
  static greaterThanOrEqual(a: usize, b: usize): bool {
    return this.greaterThan(a, b) || this.equals(a, b);
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

  /**
   * Copies U256 data from source to destination buffer
   * @param dest - Destination buffer pointer
   * @param src - Source U256 pointer
   */
  static copyInPlace(dest: usize, src: usize): void {
    for (let i = 0; i < 32; ++i) store<u8>(dest + i, load<u8>(src + i));
  }

  private static hexChar(c: u8): u8 {
    const lo = c | ASCII_CASE_MASK;
    return lo >= ASCII_a ? lo - HEX_ALPHA_OFFSET : c - ASCII_0;
  }
}