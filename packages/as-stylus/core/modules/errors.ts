/****************************************************************************************
 *  Error helpers — Stylus runtime (AssemblyScript)
 *
 *  Exposes `revert(ptr,len)` and `abort_with_data(ptr,len)` to abort execution with
 *  ABI-encoded custom-error data. Internally calls `write_result` followed by
 *  `exit_early(1)` so the EVM observes a proper REVERT.
 ****************************************************************************************/

import { exit_early, write_result } from "./hostio";
import { malloc } from "./memory";

export function abort_with_data(ptr: usize, len: usize): void {
  write_result(ptr, len);
  exit_early(1);
  unreachable();
}

/*──────────────────────────*
 *  Panic helpers            *
 *──────────────────────────*/

/**
 * Panic selector: 0x4e487b71 (Panic(uint256))
 * Used for runtime errors in Solidity 0.8.x+
 */
const PANIC_SELECTOR: u32 = 0x4e487b71;

/** Panic code for arithmetic overflow/underflow */
const PANIC_ARITHMETIC_OVERFLOW: u32 = 0x11;

/**
 * Creates panic data with selector and panic code
 * Format: [4 bytes selector][32 bytes panic code]
 */
function createPanicData(panicCode: u32): usize {
  const panicData = malloc(36); // 4 bytes selector + 32 bytes data

  // Write panic selector (big-endian)
  store<u8>(panicData + 0, <u8>(PANIC_SELECTOR >> 24));
  store<u8>(panicData + 1, <u8>(PANIC_SELECTOR >> 16));
  store<u8>(panicData + 2, <u8>(PANIC_SELECTOR >> 8));
  store<u8>(panicData + 3, <u8>PANIC_SELECTOR);

  // Clear panic code area (32 bytes)
  for (let i = 4; i < 36; ++i) {
    store<u8>(panicData + i, 0);
  }

  // Write panic code at the end (last 4 bytes of the 32-byte word)
  store<u8>(panicData + 32, <u8>(panicCode >> 24));
  store<u8>(panicData + 33, <u8>(panicCode >> 16));
  store<u8>(panicData + 34, <u8>(panicCode >> 8));
  store<u8>(panicData + 35, <u8>panicCode);

  return panicData;
}

/**
 * Panic with arithmetic overflow/underflow (code 0x11)
 * Used when integer operations would overflow or underflow
 */
export function panicArithmeticOverflow(): void {
  const panicData = createPanicData(PANIC_ARITHMETIC_OVERFLOW);
  abort_with_data(panicData, 36);
}
