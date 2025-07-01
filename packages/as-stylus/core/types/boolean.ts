import { malloc } from "../modules/memory";

export class Boolean {
  static create(value: boolean = false): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 32; ++i) store<u8>(ptr + i, 0 as u8);
    store<u8>(ptr + 31, value ? (1 as u8) : (0 as u8));
    return ptr;
  }

  static copyNew(src: usize): usize {
    return Boolean.create(Boolean.toValue(src));
  }

  static copyValue(value: usize): usize {
    return Boolean.create(Boolean.toValue(value));
  }

  static toValue(ptr: usize): boolean {
    return load<u8>(ptr + 31) == 1;
  }
}
