// // u256.ts

import { malloc } from "../modules/memory";

export class U256 {
  static create(): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, 0);
    }
    return ptr;
  }

  static setFromString(destPtr: usize, strPtr: usize, length: u32): void {
    for (let i = 0; i < 32; i++) {
      store<u8>(destPtr + i, 0);
    }

    for (let i: u32 = 0; i < length; i++) {
      const digit = load<u8>(strPtr + i) - 48;
      this.mul10(destPtr);
      this.addSmall(destPtr, digit);
    }
  }

  private static mul10(ptr: usize): void {
    const tmp = this.create();
    this.copy(tmp, ptr);   
    this.add(ptr, tmp);    // *2
    this.add(ptr, tmp);    // *4
    this.add(ptr, tmp);    // *8
    this.add(ptr, ptr);    // *16
    // Adjust to *10 manually if needed
  }

  private static addSmall(ptr: usize, value: u8): void {
    let carry = value;
    for (let i = 31; i >= 0; i--) {
      const sum = <u16>load<u8>(ptr + i) + carry;
      store<u8>(ptr + i, sum as u8);
      carry = sum > 0xFF ? 1 : 0;
    }
  }

  private static copy(dest: usize, src: usize): void {
    for (let i = 0; i < 32; i++) {
      store<u8>(dest + i, load<u8>(src + i));
    }
  }

  static add(dest: usize, src: usize): usize {
    let carry: u16 = 0;
    for (let i = 31; i >= 0; i--) {
      const sum: u16 = <u16>load<u8>(dest + i) + load<u8>(src + i) + carry;
      store<u8>(dest + i, sum as u8);
      carry = sum > 0xFF ? 1 : 0;
    }
    return dest;
  }

  static sub(dest: usize, src: usize): usize {
    let borrow: u16 = 0;
    for (let i = 31; i >= 0; i--) {
      const diff: u16 = <u16>load<u8>(dest + i) - load<u8>(src + i) - borrow;
      store<u8>(dest + i, diff as u8);
      borrow = diff < 0 ? 1 : 0;
    }
    return dest;
  }
}



// -----


// import { malloc } from "./memory";

// export type U256 = usize;

// /** Allocates 32 bytes of zeroed memory for a new U256 */
// export function allocU256(): usize {
//   const ptr = malloc(32);
//   for (let i = 0; i < 32; i++) store<u8>(ptr + i, 0);
//   return ptr;
// }

// /** Sets U256 from a u64 (big endian padded) */
// export function setU256FromU64(ptr: U256, value: u64): void {
//   for (let i = 0; i < 24; i++) store<u8>(ptr + i, 0);
//   for (let i = 0; i < 8; i++) store<u8>(ptr + 31 - i, <u8>(value >> (8 * i)));
// }

// /** Reads a u64 from U256 (assuming fits) */
// export function getU64FromU256(ptr: U256): u64 {
//   let value: u64 = 0;
//   for (let i = 0; i < 8; i++) {
//     value |= (<u64>load<u8>(ptr + 31 - i)) << (8 * i);
//   }
//   return value;
// }

// /** Copies a U256 from src to dest */
// export function copyU256(dest: U256, src: U256): void {
//   for (let i = 0; i < 32; i++) store<u8>(dest + i, load<u8>(src + i));
// }

// /** Adds src into dest (big endian) - no overflow handling */
// export function addU256(dest: U256, src: U256): void {
//   let carry: u16 = 0;
//   for (let i = 31; i >= 0; i--) {
//     const sum: u16 = <u16>load<u8>(dest + i) + load<u8>(src + i) + carry;
//     store<u8>(dest + i, <u8>sum);
//     carry = sum > 0xFF ? 1 : 0;
//   }
// }

// /** Compares lhs vs rhs
//  * Returns:
//  *  -1 if lhs < rhs
//  *   0 if lhs == rhs
//  *   1 if lhs > rhs
//  */
// export function cmpU256(lhs: U256, rhs: U256): i32 {
//   for (let i = 0; i < 32; i++) {
//     const a = load<u8>(lhs + i);
//     const b = load<u8>(rhs + i);
//     if (a < b) return -1;
//     if (a > b) return 1;
//   }
//   return 0;
// }

// export function createU256FromU64(value: u64): U256 {
//   const ptr = allocU256();
//   setU256FromU64(ptr, value);
//   return ptr;
// }



// export namespace U256 {
//   export function create(): usize {
//     const ptr = malloc(32);
//     for (let i = 0; i < 32; i++) store<u8>(ptr + i, 0);
//     return ptr;
//   }

//   export function fromU64(value: u64): usize {
//     const ptr = create();
//     for (let i = 0; i < 24; i++) store<u8>(ptr + i, 0);
//     for (let i = 0; i < 8; i++) store<u8>(ptr + 31 - i, <u8>(value >> (8 * i)));
//     return ptr;
//   }

//   export function add(dest: usize, src: usize): void {
//     let carry: u16 = 0;
//     for (let i = 31; i >= 0; i--) {
//       const sum: u16 = <u16>load<u8>(dest + i) + load<u8>(src + i) + carry;
//       store<u8>(dest + i, <u8>sum);
//       carry = sum > 0xFF ? 1 : 0;
//     }
//   }

//   export function toU64(ptr: usize): u64 {
//     let result: u64 = 0;
//     for (let i = 0; i < 8; i++) {
//       result |= (<u64>load<u8>(ptr + 31 - i)) << (8 * i);
//     }
//     return result;
//   }
// }