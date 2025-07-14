import { Address } from "viem";

export interface TransferEventLog {
  address: string;
  topics: [string, string, string, ...string[]];
  data: string;
  blockHash: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  logIndex: string;
  removed: boolean;
}

export interface StructABIAnalysis {
  totalBytes: number;
  slots: string[];
  address: string;
  stringOffset: number;
  value: number;
  boolean: boolean;
  value2: number;
  stringLength: number;
  stringContent: string;
}

export interface StructInfo {
  to: Address;
  contents: string;
  value: bigint;
  flag: boolean;
  value2: bigint;
}

export type DecodedError = {
  errorName: string;
  args: unknown[];
};
