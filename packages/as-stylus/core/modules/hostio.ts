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

@external("vm_hooks", "delegate_call_contract")
declare function _delegate_call_contract(
  to: usize,
  data: usize,
  data_len: usize,
  gas: u64,
  outs_len: usize
): u8;

@external("vm_hooks", "static_call_contract")
declare function _static_call_contract(
  to: usize,
  data: usize,
  data_len: usize,
  gas: u64,
  outs_len: usize
): u8;            

@external("vm_hooks", "account_balance")
declare function _account_balance(address: usize, dest: usize): void;

@external("vm_hooks", "read_return_data")
declare function _read_return_data(dest: usize, offset: usize, size: usize): usize;

@external("vm_hooks", "exit_early")
declare function _exit_early(status: i32): void;

@external("vm_hooks", "account_codehash")
declare function _account_codehash(address: usize, dest: usize): void;

@external("vm_hooks", "block_timestamp")
declare function _block_timestamp(): u64;

@external("vm_hooks", "block_number")
declare function _block_number(): u64;

@external("vm_hooks", "block_coinbase")
declare function _block_coinbase(dest: usize): void;

@external("vm_hooks", "block_basefee")
declare function _block_basefee(dest: usize): void;

@external("vm_hooks", "block_gas_limit")
declare function _block_gas_limit(): u64;

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

export function delegate_call_contract(
  to: usize,
  data: usize,
  data_len: usize,
  gas: u64,
  outs_len: usize
): u8 {
  return _delegate_call_contract(to, data, data_len, gas, outs_len);
}

export function static_call_contract(
  to: usize,
  data: usize,
  data_len: usize,
  gas: u64,
  outs_len: usize
): u8 {
  return _static_call_contract(to, data, data_len, gas, outs_len);
}

export function read_return_data(dest: usize, offset: usize, size: usize): usize {
  return _read_return_data(dest, offset, size);
}

export function exit_early(status: i32): void {
  _exit_early(status);
}

export function account_codehash(address: usize, dest: usize): void {
  _account_codehash(address, dest);
}

export function block_timestamp(): u64 {
  return _block_timestamp();
}

export function block_number(): u64 {
  return _block_number();
}

export function block_coinbase(dest: usize): void {
  _block_coinbase(dest);
}

export function block_basefee(dest: usize): void {
  _block_basefee(dest);
}

export function block_gas_limit(): u64 {
  return _block_gas_limit();
}