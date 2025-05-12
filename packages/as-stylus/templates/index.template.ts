// @ts-nocheck
/* eslint-disable */

// Auto-generated contract template

import { __keep_imports } from "../../../as-stylus/core/modules/keep-imports";
import { read_args, write_result } from "../../../as-stylus/core/modules/hostio";

// @logic_imports

__keep_imports(false);

export function user_entrypoint(args_len: usize): i32 {
  const position = memory.grow(<i32>((args_len + 0xffff) >> 16));
  read_args(position);
  const selector: u32 =
  (<u32>load<u8>(0) << 24) |
  (<u32>load<u8>(1) << 16) |
  (<u32>load<u8>(2) << 8)  |
  (<u32>load<u8>(3));
  let result: u64 = 0;

  // @user_entrypoint

  return 0;
}
