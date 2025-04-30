import {
  read_args,
  write_result,
  msg_reentrant,
  msg_value,
  msg_sender,
  storage_load_bytes32,
  pay_for_memory_grow,
  storage_cache_bytes32,
  storage_flush_cache,
  native_keccak256,
} from "./hostio";

// Keep all host functions during linking
export function __keep_imports(cond: boolean): void {
  read_args(0);
  write_result(0, 0);
  msg_reentrant();
  msg_value(0);
  msg_sender(0);
  storage_load_bytes32(0, 0);
  pay_for_memory_grow(0);
  storage_cache_bytes32(0, 0);
  storage_flush_cache(0);
  native_keccak256(0, 0, 0);
}
