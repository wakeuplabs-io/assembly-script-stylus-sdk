/****************************************************************************************
 *  Event helpers — Stylus runtime (AssemblyScript)s)
 *
 *  All buffers are reserved with `malloc`, which already handles memory.grow
 *  and pay_for_memory_grow according to your `memory.ts` module.
 ****************************************************************************************/

import { emit_log } from "./hostio";
import { malloc } from "./memory";

/*─────────────────────────────────────────────────────────────────────────────*
 *  emitTopics
 *─────────────────────────────────────────────────────────────────────────────*/
/**
 *  @param topicsPtr   A contiguous buffer containing topic0‥topicN (N≤3) – 32 B each
 *  @param topicCount  Total number of topics (≥0, ≤4)
 *  @param dataPtr     A blob of ABI data (can be 0 if dataLen==0)
 *  @param dataLen     Length in bytes of `dataPtr`
 *
 *  Copies topics + data into a single buffer and calls emit_log.
 */
export function emitTopics(topicsPtr: usize, topicCount: u32, dataPtr: usize, dataLen: u32): void {
  const total: u32 = topicCount * 32 + dataLen;
  const buf: usize = malloc(total);

  memory.copy(buf, topicsPtr, topicCount * 32); // topics
  if (dataLen) memory.copy(buf + topicCount * 32, dataPtr, dataLen); // data

  emit_log(buf, total, topicCount);
}

export function addTopic(dest: usize, src: usize, size: i32): void {
  const pad = 32 - size;
  for (let i = 0; i < pad; ++i) {
    store<u8>(dest + i, 0);
  }
  for (let i = 0; i < size; ++i) {
    store<u8>(dest + pad + i, load<u8>(src + i));
  }
}
