/******************************************************************
 * Address — low-level (20-byte big-endian buffer)
 ******************************************************************/
import { malloc } from "../modules/memory";

export class Address {
  /*──────── helpers ────────*/
  static create(): usize {
    const ptr = malloc(20);
    for (let i = 0; i < 20; ++i) store<u8>(ptr + i, 0);
    return ptr;
  }

  static setFromStringHex(dest: usize, str: usize, len: u32): void {
    let off: u32 = 0;
    if (len >= 2 && load<u8>(str) == 0x30 && (load<u8>(str + 1) | 0x20) == 0x78) off = 2;

    const nibs: u32 = len - off;
    const start = 20 - ((nibs + 1) >>> 1);

    for (let i = 0; i < 20; ++i) store<u8>(dest + i, 0);

    let d: i32 = 19;
    let s: i32 = <i32>(off + nibs - 1);

    if (nibs & 1) {
      store<u8>(dest + d--, hexChar(load<u8>(str + s--)));
    }
    while (d >= start && s >= <i32>off + 1) {
      const low = hexChar(load<u8>(str + s));
      const high = hexChar(load<u8>(str + s - 1));
      store<u8>(dest + d--, (high << 4) | low);
      s -= 2;
    }
  }
  static fromBytes(ptr_20: usize): usize {
    const addr = Address.create();
    for (let i: i32 = 0; i < 20; ++i) {
      store<u8>(addr + i, load<u8>(ptr_20 + i));
    }
    return addr;
  }

  static equals(a: usize, b: usize): usize {
    const ptr = malloc(1);
    for (let i: usize = 0; i < 20; ++i) {
      store<u8>(ptr, load<u8>(a + i) ^ load<u8>(b + i));
    }
    if (load<u8>(ptr) == 0) {
      store<u8>(ptr, 1);
    } else {
      store<u8>(ptr, 0);
    }
    return ptr;
  }

  static isZero(ptr_address: usize): usize {
    const ptr = malloc(1);
    for (let i: i32 = 0; i < 20; ++i) {
      if (load<u8>(ptr_address + i) != 0) {
        store<u8>(ptr, 0);
        return ptr;
      }
    }
    store<u8>(ptr, 1);
    return ptr;
  }
  static fromString(strPtr: usize, len: u32): usize {
    const addr = Address.create();
    this.setFromStringHex(addr, strPtr, len);
    return addr;
  }

  static topic(addr: usize): usize {
    const t = malloc(32);
    for (let i = 0; i < 12; ++i) store<u8>(t + i, 0);
    for (let i = 0; i < 20; ++i) store<u8>(t + 12 + i, load<u8>(addr + i));
    return t;
  }
}
function hexChar(c: u8): u8 {
  const lo = c | 0x20;
  return lo >= 0x61 ? lo - 0x57 : c - 0x30; // 'a'-10 : '0'
}