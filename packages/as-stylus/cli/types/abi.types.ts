export const VISIBILITY_DECORATORS = ["Public", "Private", "Internal", "External"];
export const VISIBILITY_ABI = ["public", "private", "internal", "external"];
export const STATE_MUTABILITY_DECORATORS = ["Pure", "View", "NonPayable", "Payable"];
export const STATE_MUTABILITY_ABI = ["pure", "view", "nonpayable", "payable"];
export const ABI_ITEM_TYPES = ["function", "constructor"];

export type Visibility = typeof VISIBILITY_DECORATORS[number];
export type AbiVisibility = typeof VISIBILITY_ABI[number];
export type AbiStateMutability = typeof STATE_MUTABILITY_ABI[number];
export type AbiItemType = typeof ABI_ITEM_TYPES[number];

export type AbiInput = {
  name: string;
  type: string;
};

export type AbiOutput = {
  name?: string;
  type: string;
};

export type AbiItem = {
  name?: string;
  type: AbiItemType;
  stateMutability: AbiStateMutability;
  inputs: AbiInput[];
  outputs: AbiOutput[];
};
