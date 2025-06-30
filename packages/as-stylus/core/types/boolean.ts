import { malloc } from "../modules/memory";

export class Boolean {
  static create(value: boolean = false): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(ptr + i, 0 as u8);
    store<u8>(ptr + 31, value ? (1 as u8) : (0 as u8));
    return ptr;
  }

  static copyNew(src: usize): usize {
    const dst = malloc(1);
    store<u8>(dst, load<u8>(src));
    return dst;
  }

  static copyValue(value: u8): usize {
    const dst = malloc(1);
    store<u8>(dst, value);
    return dst;
  }

  static toValue(ptr: usize): boolean {
    return load<u8>(ptr + 31) == 1;
  }
}
