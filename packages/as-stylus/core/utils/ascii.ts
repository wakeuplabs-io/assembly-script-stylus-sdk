export const ZERO_ASCII = 0x30;
export const X_ASCII = 0x78;
const LOWER_A_ASCII = 0x61;

export function hexIsZeroPrefix(str: usize, len: u32): boolean {
  return len >= 2 && load<u8>(str) == ZERO_ASCII && (load<u8>(str + 1) | 0x20) == X_ASCII;
}

export function hexChar(c: u8): u8 {
  const CONVERT_TO_LOWER = 0x20;
  const LETTER_OFFSET = 0x57;

  const lowerCase = c | CONVERT_TO_LOWER;

  if (lowerCase >= LOWER_A_ASCII) {
    return lowerCase - LETTER_OFFSET;
  }

  return c - ZERO_ASCII;
}
