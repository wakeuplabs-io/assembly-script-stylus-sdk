export enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private",
  INTERNAL = "internal",
  EXTERNAL = "external",
  PURE = "pure",
  VIEW = "view",
  NONPAYABLE = "nonpayable",
  PAYABLE = "payable",
}

export const VISIBILITY_ABI = [
  Visibility.PUBLIC,
  Visibility.PRIVATE,
  Visibility.INTERNAL,
  Visibility.EXTERNAL,
  Visibility.PURE,
  Visibility.VIEW,
  Visibility.NONPAYABLE,
  Visibility.PAYABLE,
];
export const STATE_MUTABILITY_ABI = [
  Visibility.PURE,
  Visibility.VIEW,
  Visibility.NONPAYABLE,
  Visibility.PAYABLE,
];
export const ABI_ITEM_TYPES = ["function", "constructor"];

export type AbiVisibility = (typeof VISIBILITY_ABI)[number];
export type AbiStateMutability = (typeof STATE_MUTABILITY_ABI)[number];
export type AbiItemType = (typeof ABI_ITEM_TYPES)[number];

export enum AbiType {
  Bool = "bool",
  String = "string",
  Address = "address",
  Uint256 = "uint256",
  Int256 = "int256",
  Bytes32 = "bytes32",
  Struct = "struct",
  Array = "array",
  // TODO: Analyze if we need these
  Void = "void",
  Any = "any",
  Mapping = "mapping",
  Mapping2 = "mapping2",
  Function = "function",
  Unknown = "unknown",
}

export enum AssemblyScriptType {
  Bool = "boolean",
  String = "string",
  Address = "address",
  Uint256 = "uint256",
  Pointer = "usize",
}

export type AbiInput = {
  name: string;
  type: AbiType;
};

export type AbiOutput = {
  name?: string;
  type: AbiType;
};

export type AbiItem = {
  name?: string;
  type: AbiItemType;
  stateMutability: AbiStateMutability;
  inputs: AbiInput[];
  outputs: AbiOutput[];
};
