import { malloc } from "../modules/memory";

export type address = usize;

export namespace Address {
  /**
   * Allocates a 32-byte zero Address (0x000...00)
   */
  export function zero(): address {
    const ptr = malloc(32);
    for (let i = 0; i < 32; i++) {
      store<u8>(ptr + i, 0);
    }
    return ptr;
  }


  /**
   * Allocates a 32-byte Address from raw 20-byte input
   */
  export function clone(raw: usize): address {
    const ptr = malloc(20);
    for (let i = 0; i < 20; i++) {
      store<u8>(ptr + 12 + i, load<u8>(raw + i));
    }
    return ptr;
  }

  /**
   * Compare two 32-byte addresses.
   */
  export function equals(a: address, b: address): bool {
    for (let i = 0; i < 32; i++) {
      if (load<u8>(a + i) != load<u8>(b + i)) return false;
    }
    return true;
  }
}
