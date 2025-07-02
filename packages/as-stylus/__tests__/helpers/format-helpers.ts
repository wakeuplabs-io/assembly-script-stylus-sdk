// ---------------------------------------------------------------
//  Format Helpers — padding and formatting utilities
// ---------------------------------------------------------------

export const pad64 = (v: bigint, with0x = true) =>
  (with0x ? "0x" : "") + v.toString(16).padStart(64, "0");

export const padAddress = (v: bigint, with0x = true) =>
  (with0x ? "0x" : "") + v.toString(16).padStart(40, "0");

export const padBool = (v: boolean, with0x = true) => (with0x ? "0x" : "") + (v ? "01" : "00");

export function calldata(selector: string, ...args: string[]): string {
  const clean = (h: string) => (h.startsWith("0x") ? h.slice(2) : h);
  return `0x${clean(selector)}${args.map(clean).join("")}`;
}
