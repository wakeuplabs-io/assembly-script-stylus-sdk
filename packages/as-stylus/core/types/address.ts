/******************************************************************
 * Address — implementación low-level (buffer 20 bytes big-endian) *
 ******************************************************************/

import { malloc } from "../modules/memory";

export class Address {
  static create(): usize {
    const ptr = malloc(20);
    for (let i: i32 = 0; i < 20; ++i) store<u8>(ptr + i, 0);
    return ptr;
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

  static topic(addrPtr: usize): usize {
    const t = malloc(32);
    for (let i = 0; i < 12; ++i) store<u8>(t + i, 0);
    for (let i = 0; i < 20; ++i) store<u8>(t + 12 + i, load<u8>(addrPtr + i));
    return t;
  }
}
