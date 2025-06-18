import { AbiCoder } from "ethers";

const abi = new AbiCoder();
export function parseAbiString(hex: string) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const offset = parseInt(clean.slice(0, 64), 16);
  const len = parseInt(clean.slice(64, 128), 16);
  const data = clean.slice(128, 128 + len * 2);
  return { offset, len, dataHex: data };
}

export function decodeStringReturn(hex: string): string {
  const clean = hex.trim();
  return abi.decode(["string"], clean)[0] as string;
}

export function encodeStringInput(str: string): string {
  return abi.encode(["string"], [str]).slice(2);
}

export function encodeStringsDynamic(...args: string[]): string {
  const types = args.map(() => "string");
  return abi.encode(types, args).slice(2);
}
