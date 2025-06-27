import { malloc } from "../modules/memory";

export function allocBool(value: bool): usize {
  const ptr = malloc(32);
  for (let i = 0; i < 32; ++i) store<u8>(ptr + i, 0 as u8);
  store<u8>(ptr + 31, value ? (1 as u8) : (0 as u8));
  return ptr;
}

export function toBool(ptr: usize): boolean {
  return load<u8>(ptr + 31) == 1;
}
