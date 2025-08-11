import { U256 } from "../types/u256";
import { malloc } from "./memory";

@external("console", "log_i32") declare function _log_i32(val: i32): void;
@external("console", "log_txt") declare function _log_txt(ptr: usize, len: usize): void;

// Alias legible
function logI32(val: i32): void {
  _log_i32(val);
}
function logTxt(ptr: usize, len: i32): void {
  _log_txt(ptr, len);
}

export class DebugAddress {
  static raw(addr: usize): void {
    const off = addr + 12;
    for (let i = 0; i < 5; ++i) logI32(load<u32>(off + i * 4));
  }

  static hex(addr: usize): void {
    const BUF = malloc(42);
    store<u16>(BUF, 0x7830);

    const off = addr + 12;
    for (let i = 0; i < 20; ++i) {
      const b = load<u8>(off + i);
      store<u8>(BUF + 2 + i * 2, toHex(b >> 4));
      store<u8>(BUF + 2 + i * 2 + 1, toHex(b & 0x0f));
    }
    logTxt(BUF, 42);
  }
}

export class DebugU256 {
  static raw(ptr: usize): void {
    for (let i = 0; i < 8; ++i) logI32(load<u32>(ptr + i * 4));
  }

  static hex(ptr: usize): void {
    const BUF = malloc(66);
    store<u16>(BUF, 0x7830);
    for (let i = 0; i < 32; ++i) {
      const b = load<u8>(ptr + i);
      store<u8>(BUF + 2 + i * 2, toHex(b >> 4));
      store<u8>(BUF + 2 + i * 2 + 1, toHex(b & 0x0f));
    }
    logTxt(BUF, 66);
  }

  static dec(ptr: usize): void {
    const tmp = U256.copy(ptr);
    const buf = malloc(100);
    let len: u32 = 0;

    while (!isZero(tmp)) {
      const r = divMod10(tmp);
      store<u8>(buf + len++, 0x30 + r);
    }
    if (len == 0) {
      store<u8>(buf, 0x30);
      len = 1;
    }

    for (let i: u32 = 0; i < len / 2; ++i) {
      const a = load<u8>(buf + i);
      const b = load<u8>(buf + (len - 1 - i));
      store<u8>(buf + i, b);
      store<u8>(buf + (len - 1 - i), a);
    }
    logTxt(buf, len as i32);
  }
}

function toHex(n: u8): u8 {
  return n < 10 ? 0x30 + n : 0x61 + (n - 10);
}

function isZero(ptr: usize): bool {
  for (let i = 0; i < 32; ++i) if (load<u8>(ptr + i)) return false;
  return true;
}

function divMod10(ptr: usize): u8 {
  let rem: u16 = 0;
  for (let i = 0; i < 32; ++i) {
    rem = (rem << 8) + load<u8>(ptr + i);
    store<u8>(ptr + i, <u8>(rem / 10));
    rem %= 10;
  }
  return <u8>rem;
}
