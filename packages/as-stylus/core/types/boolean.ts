// core/boolean.ts
export function allocBool(value: bool): usize {
  const ptr = memory.data(1);
  store<u8>(ptr, value ? 1 : 0);
  return ptr;
}
