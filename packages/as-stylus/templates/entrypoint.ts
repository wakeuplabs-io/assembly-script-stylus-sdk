export function getUserEntrypointTemplate(): string {
  return `import { write_result } from "../as-stylus/core/modules/hostio";

// @logic_imports

export function main(selector: u32): i32 {
// @user_entrypoint
  return -1;
}
`;
}
