/******************************************************************
 * Address — low-level (20-byte big-endian buffer)
 ******************************************************************/
import { malloc } from "../modules/memory";

export class Address {
  static ADDRESS_SIZE: u32 = 32;

  /*──────── helpers ────────*/
  static create(): usize {
    const ptr = malloc(32);
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) store<u8>(ptr + i, 0);
    return ptr;
  }

  static setFromStringHex(dest: usize, str: usize, len: u32): void {
    let off: u32 = 0;
    if (len >= 2 && load<u8>(str) == 0x30 && (load<u8>(str + 1) | 0x20) == 0x78) off = 2;

    const nibs: u32 = len - off;
    const start = Address.ADDRESS_SIZE - ((nibs + 1) >>> 1);

    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) store<u8>(dest + i, 0);

    let d: u32 = 19;
    let s: u32 = <u32>(off + nibs - 1);

    if (nibs & 1) {
      store<u8>(dest + d--, hexChar(load<u8>(str + s--)));
    }
    while (d >= start && s >= <u32>off + 1) {
      const low = hexChar(load<u8>(str + s));
      const high = hexChar(load<u8>(str + s - 1));
      store<u8>(dest + d--, (high << 4) | low);
      s -= 2;
    }
  }
  static fromBytes(ptr_20: usize): usize {
    const addr = Address.create();
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
      store<u8>(addr + i, load<u8>(ptr_20 + i));
    }
    return addr;
  }

  static equals(a: usize, b: usize): boolean {
    for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
      const a_i = load<u8>(a + i);
      const b_i = load<u8>(b + i);
      if (a_i !== b_i) {
        return false;
      }
    }
    return true;
  }

  static isZero(ptr_address: usize): boolean {
    for (let i: u32 = 0; i < this.ADDRESS_SIZE; ++i) {
      if (load<u8>(ptr_address + i) != 0) {
        return false;
      }
    }
    return true;
  }

  static fromString(strPtr: usize, len: u32): usize {
    const addr = Address.create();
    this.setFromStringHex(addr, strPtr, len);
    return addr;
  }

  static topic(addr: usize): usize {
    const t = malloc(32);
    for (let i: u32 = 0; i < this.ADDRESS_SIZE; ++i) store<u8>(t + i, load<u8>(addr + i));
    return t;
  }

  static copyNew(src: usize): usize {
    const dst = this.create();
    for (let i: u32 = 0; i < this.ADDRESS_SIZE; ++i) {
      store<u8>(dst + i, load<u8>(src + i));
    }
    return dst;
  }
}

function hexChar(c: u8): u8 {
  const lo = c | 0x20;
  return lo >= 0x61 ? lo - 0x57 : c - 0x30; // 'a'-10 : '0'
}
