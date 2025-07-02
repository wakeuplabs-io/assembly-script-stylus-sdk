export function getUserEntrypointTemplate(): string {
  return `
/* eslint-disable */

// Auto-generated contract template
import "./assembly/stylus/stylus";
import { __keep_imports } from "as-stylus/core/modules/keep-imports";
import { read_args, write_result } from "as-stylus/core/modules/hostio";
import { initHeap, malloc } from "as-stylus/core/modules/memory";
import { loadU32BE } from "as-stylus/core/modules/endianness";
import { Str } from "as-stylus/core/types/str";
import { Boolean } from "as-stylus/core/types/boolean";

// @logic_imports

__keep_imports(false);

export function user_entrypoint(args_len: usize): i32 {
  const position = memory.grow(<i32>((args_len + 0xffff) >> 16));
  read_args(position);
  initHeap(position, args_len);
  const selector: u32 =
    (<u32>load<u8>(position) << 24) |
    (<u32>load<u8>(position + 1) << 16) |
    (<u32>load<u8>(position + 2) << 8) |
    (<u32>load<u8>(position + 3));
  let result: u64 = 0;

  // @user_entrypoint

  return 0;
}
`;
}
