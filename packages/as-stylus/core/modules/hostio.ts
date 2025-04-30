@external("vm_hooks", "native_keccak256")
declare function _native_keccak256(bytes: usize, len: usize, output: usize): void;
@external("vm_hooks", "msg_reentrant")
declare function _msg_reentrant(): i32;

@external("vm_hooks", "msg_value")
declare function _msg_value(ptr: usize): void;

@external("vm_hooks", "msg_sender")
declare function _msg_sender(ptr: usize): void;

@external("vm_hooks", "read_args")
declare function _read_args(ptr: usize): void;

@external("vm_hooks", "write_result")
declare function _write_result(ptr: usize, len: usize): void;

@external("vm_hooks", "pay_for_memory_grow")
declare function _pay_for_memory_grow(pages: i32): void;

@external("vm_hooks", "storage_load_bytes32")
declare function _storage_load_bytes32(keyPtr: usize, destPtr: usize): void;

@external("vm_hooks", "storage_cache_bytes32")
declare function _storage_cache_bytes32(keyPtr: usize, valuePtr: usize): void;

@external("vm_hooks", "storage_flush_cache")
declare function _storage_flush_cache(clear: i32): void;

@external("vm_hooks", "emit_log")
declare function _emit_log(dataPtr: usize, len: usize, topics: usize): void;

@external("vm_hooks", "call_contract")
declare function _call_contract(
  to: usize,
  data: usize,
  data_len: usize,
  value: usize,
  gas: u64,
  outs_len: usize
): u8;            

@external("vm_hooks", "account_balance")
declare function _account_balance(address: usize, dest: usize): void;

@external("vm_hooks", "read_return_data")
declare function _read_return_data(dest: usize, offset: usize, size: usize): usize;

@external("env", "abort")
export declare function abort(
  msg: usize,
  file: usize,
  line: u32,
  col: u32
): void;

export function msg_reentrant(): i32 {
  return _msg_reentrant();
}

export function msg_value(ptr: usize): void {
  _msg_value(ptr);
}

export function msg_sender(ptr: usize): void {
  _msg_sender(ptr);
}

export function read_args(ptr: usize): void {
  _read_args(ptr);
}

export function write_result(ptr: usize, len: usize): void {
  _write_result(ptr, len);
}

export function pay_for_memory_grow(pages: i32): void {
  _pay_for_memory_grow(pages);
}

export function storage_load_bytes32(keyPtr: usize, destPtr: usize): void {
  _storage_load_bytes32(keyPtr, destPtr);
}

export function storage_cache_bytes32(keyPtr: usize, valuePtr: usize): void {
  _storage_cache_bytes32(keyPtr, valuePtr);
}

export function storage_flush_cache(clear: i32): void {
  _storage_flush_cache(clear);
}

export function native_keccak256(bytes: usize, len: usize, output: usize): void {
  _native_keccak256(bytes, len, output);
}

export function emit_log(dataPtr: usize, len: usize, topics: usize): void {
  _emit_log(dataPtr, len, topics);
}

export function account_balance(address: usize, dest: usize): void {
  _account_balance(address, dest);
}

export function call_contract(
  to: usize,
  data: usize,
  data_len: usize,
  value: usize,
  gas: u64,
  outs_len: usize
): u8 {
  return _call_contract(to, data, data_len, value, gas, outs_len);
}

export function read_return_data(dest: usize, offset: usize, size: usize): usize {
  return _read_return_data(dest, offset, size);
}