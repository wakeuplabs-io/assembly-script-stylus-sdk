/**
 * Stylus Logging Utilities
 *
 * This module provides helper functions to emit EVM-compatible logs (events)
 * from Stylus smart contracts written in AssemblyScript.
 *
 * Features:
 * - Create 32-byte topics dynamically using `createTopic`
 * - Emit logs without any data (LOG1-style)
 * - Emit logs with 1 or 2 topics, optionally including a U256-encoded `u64` value
 *
 */

import { emit_log } from "./hostio";

export function createTopic(value: u8): usize {
  const page = memory.grow(1);
  const ptr: usize = page << 16;

  for (let i = 0; i < 32; i++) {
    store<u8>(ptr + i, 0);
  }

  store<u8>(ptr + 31, value);
  return ptr;
}

export function emit_log_only_topic(t1: usize): void {
  const ptr = memory.grow((32 + 0xffff) >> 16);

  for (let i = 0; i < 32; i++) {
    store<u8>(ptr + i, load<u8>(t1 + i));
  }

  emit_log(ptr, 0, 1);
}

export function emit_log_u256_with_topic(t1: usize, value: u64): void {
  const totalLen = 64;
  const ptr = memory.grow((totalLen + 0xffff) >> 16);

  for (let i = 0; i < 32; i++) {
    store<u8>(ptr + i, load<u8>(t1 + i));
  }

  const dataOffset = ptr + 32;
  for (let i = 0; i < 24; i++) store<u8>(dataOffset + i, 0);
  for (let i = 0; i < 8; i++) {
    store<u8>(dataOffset + 31 - i, <u8>(value >> (8 * i)));
  }

  emit_log(ptr, totalLen, 1);
}


export function emit_log_u256_with_topics(t1: usize, t2: usize, value: u64): void {
  const totalLen = 96;
  const ptr = memory.grow((totalLen + 0xffff) >> 16);

  for (let i = 0; i < 32; i++) {
    store<u8>(ptr + i, load<u8>(t1 + i));
    store<u8>(ptr + 32 + i, load<u8>(t2 + i));
  }

  const dataOffset = ptr + 64;
  for (let i = 0; i < 24; i++) store<u8>(dataOffset + i, 0);
  for (let i = 0; i < 8; i++) {
    store<u8>(dataOffset + 31 - i, <u8>(value >> (8 * i)));
  }

  emit_log(ptr, totalLen, 2);
}



