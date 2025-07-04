/****************************************************************************************
 *  Error helpers — Stylus runtime (AssemblyScript)
 *
 *  Exposes `revert(ptr,len)` and `abort_with_data(ptr,len)` to abort execution with
 *  ABI-encoded custom-error data. Internally calls `write_result` followed by
 *  `exit_early(1)` so the EVM observes a proper REVERT.
 ****************************************************************************************/

import { exit_early, write_result } from "./hostio";

function revert(ptr: usize, len: usize): void {
  write_result(ptr, len);
  exit_early(1);
  unreachable();
}

export function abort_with_data(ptr: usize, len: usize): void {
  revert(ptr, len);
}
