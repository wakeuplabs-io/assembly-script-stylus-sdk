import { malloc } from "../modules/memory";

export class Boolean {
  static create(value: bool = false): usize {
    const ptr = malloc(1);
    store<u8>(ptr, value ? 1 : 0);
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
}
