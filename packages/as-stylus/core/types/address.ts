/******************************************************************
 * Address — low-level (20-byte big-endian buffer)
 ******************************************************************/
import { account_codehash } from "../modules/hostio";
import { malloc } from "../modules/memory";
import { hexChar, hexIsZeroPrefix } from "../utils/ascii";

export class Address {
  static ADDRESS_SIZE: u32 = 32; // Ethereum addresses are 20 bytes, not 32
  private static EMPTY_HASH: u8[] = [
    0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03, 0xc0,
    0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b, 0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
  ];

  static create(): usize {
    const ptr = malloc(32);
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) store<u8>(ptr + i, 0);
    return ptr;
  }

  static setFromStringHex(destAddress: usize, hexString: usize, hexLength: u32): void {
    let prefixOffset: u32 = 0;
    if (hexIsZeroPrefix(hexString, hexLength)) prefixOffset = 2;

    const hexDigits: u32 = hexLength - prefixOffset;

    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) store<u8>(destAddress + i, 0);

    let destByteIndex: i32 = Address.ADDRESS_SIZE - 1;
    let sourceCharIndex: i32 = <i32>(prefixOffset + hexDigits - 1);

    if (hexDigits & 1) {
      if (destByteIndex >= 0) {
        store<u8>(destAddress + destByteIndex--, hexChar(load<u8>(hexString + sourceCharIndex--)));
      }
    }

    // Process pairs of hex digits
    while (destByteIndex >= 0 && sourceCharIndex >= <i32>prefixOffset + 1) {
      const lowNibble = hexChar(load<u8>(hexString + sourceCharIndex));
      const highNibble = hexChar(load<u8>(hexString + sourceCharIndex - 1));
      store<u8>(destAddress + destByteIndex--, (highNibble << 4) | lowNibble);
      sourceCharIndex -= 2;
    }
  }

  static fromBytes(ptr_20: usize): usize {
    const addr = Address.create();
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
      store<u8>(addr + i, load<u8>(ptr_20 + i));
    }
    return addr;
  }

  static equals(a: usize, b: usize): bool {
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
      const a_i = load<u8>(a + i);
      const b_i = load<u8>(b + i);
      if (a_i !== b_i) {
        return false;
      }
    }
    return true;
  }

  static isZero(ptr_address: usize): bool {
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
      if (load<u8>(ptr_address + i) != 0) {
        return false;
      }
    }
    return true;
  }

  static fromString(strPtr: usize, len: u32): usize {
    const addr = Address.create();
    Address.setFromStringHex(addr, strPtr, len);
    return addr;
  }

  static topic(addr: usize): usize {
    const t = malloc(32);
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) store<u8>(t + i, load<u8>(addr + i));
    for (let i: u32 = Address.ADDRESS_SIZE; i < 32; ++i) store<u8>(t + i, 0);
    return t;
  }

  static copyNew(src: usize): usize {
    const dst = Address.create();
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
      store<u8>(dst + i, load<u8>(src + i));
    }
    return dst;
  }

  static hasCode(addrPtr: usize): bool {
    const hashPtr = malloc(32);
    account_codehash(addrPtr, hashPtr);

    let allZero = true;
    for (let i: u32 = 0; i < 32; ++i) {
      if (load<u8>(hashPtr + i) != 0) {
        allZero = false;
        break;
      }
    }
    if (allZero) return false;

    for (let i: u32 = 0; i < 32; ++i) {
      if (load<u8>(hashPtr + i) != Address.EMPTY_HASH[i]) {
        return true;
      }
    }
    return false;
  }
}
