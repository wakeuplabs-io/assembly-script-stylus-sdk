import { malloc } from "./memory";

@external("console", "log_i32")
declare function log_i32(val: i32): void;

@external("console", "log_txt")
declare function log_txt(ptr: usize, len: usize): void;

export function debugLogTxt(ptr: usize, len: i32): void {
  log_txt(ptr, len);
}

export function debugLogI32(val: i32): void {
  log_i32(val);
}