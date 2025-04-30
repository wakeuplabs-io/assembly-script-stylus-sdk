// @ts-nocheck
/* eslint-disable */

// Auto-generated contract template

import { __keep_imports } from "../../../core/modules/keep-imports";
import { read_args, write_result } from "../../../core/modules/hostio";

// @logic_imports

__keep_imports(false);

export function user_entrypoint(args_len: usize): i32 {
  const position = memory.grow(<i32>((args_len + 0xffff) >> 16));
  read_args(position);
  const selector = load<u8>(0);

  // @user_entrypoint

  let result: u64 = 0;
  write_result(result as usize, sizeof<u64>());
  return 0;
}
