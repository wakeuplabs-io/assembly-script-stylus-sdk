import { malloc } from "./memory";

@external("console", "log_i32")
declare function log_i32(val: i32): void;

@external("console", "log_i64")
declare function log_i64(val: i64): void;

@external("console", "log_txt")
declare function log_txt(ptr: usize, len: usize): void;

export function debugLogI32(val: i32): void {
  log_i32(val);
}

export function debugLogUSize(val: usize): void {
  log_i32(<i32>val);
}

export function debugLogI64(val: i64): void {
  log_i64(val);
}

export function debugLogAddress(ptr: usize): void {
  const addrOffset = ptr + 12;

  for (let i = 0; i < 5; i++) {
    const chunk = load<u32>(addrOffset + i * 4);
    log_i32(chunk);
  }
}

export function debugLogU256(ptr: usize): void {
  for (let i = 0; i < 8; i++) {
    const chunk = load<u32>(ptr + i * 4);
    log_i32(chunk);
  }
}

export function debugLogAddressHex(ptr: usize): void {
  const offset = ptr + 12;
  const strLen = 2 + 40;

  const strPtr = memory.grow((strLen + 0xffff) >> 16);

  store<u8>(strPtr, 0x30);
  store<u8>(strPtr + 1, 0x78);

  for (let i = 0; i < 20; i++) {
    const byte = load<u8>(offset + i);
    const hi = byte >> 4;
    const lo = byte & 0x0f;
    store<u8>(strPtr + 2 + i * 2, hexChar(hi));
    store<u8>(strPtr + 2 + i * 2 + 1, hexChar(lo));
  }

  log_txt(strPtr, strLen);
}

function hexChar(n: u8): u8 {
  return n < 10 ? 0x30 + n : 0x61 + (n - 10);
}

export function debugLogU256Hex(ptr: usize): void {
  const strLen = 2 + 64;
  const strPtr = memory.grow((strLen + 0xffff) >> 16);

  store<u8>(strPtr, 0x30);
  store<u8>(strPtr + 1, 0x78);

  for (let i = 0; i < 32; i++) {
    const byte = load<u8>(ptr + i);
    const hi = byte >> 4;
    const lo = byte & 0x0f;
    store<u8>(strPtr + 2 + i * 2, hexChar(hi));
    store<u8>(strPtr + 2 + i * 2 + 1, hexChar(lo));
  }

  log_txt(strPtr, strLen);
}

export function debugLogU256Decimal(ptr: usize): void {
  const bufPtr = malloc(100); 
  let bufLen = 0;

  const tmp = malloc(32);
  for (let i = 0; i < 32; i++) {
    store<u8>(tmp + i, load<u8>(ptr + i));
  }

  while (!isZero(tmp)) {
    const rem = divModU256By10(tmp);
    store<u8>(bufPtr + bufLen, 0x30 + rem);
    bufLen += 1;
  }

  if (bufLen == 0) {
    store<u8>(bufPtr, 0x30);
    bufLen = 1;
  }

  const revPtr = malloc(bufLen);
  for (let i = 0; i < bufLen; i++) {
    store<u8>(revPtr + i, load<u8>(bufPtr + (bufLen - 1 - i)));
  }

  log_txt(revPtr, bufLen);
}

export function debugLogTxt(ptr: usize, len: i32): void {
  log_txt(ptr, len);
}




function isZero(ptr: usize): bool {
  for (let i = 0; i < 32; i++) {
    if (load<u8>(ptr + i) != 0) return false;
  }
  return true;
}

function divModU256By10(ptr: usize): u8 {
  let rem: u16 = 0;
  for (let i = 0; i < 32; i++) {
    rem = (rem << 8) + load<u8>(ptr + i);
    store<u8>(ptr + i, <u8>(rem / 10));
    rem %= 10;
  }
  return <u8>rem;
}
