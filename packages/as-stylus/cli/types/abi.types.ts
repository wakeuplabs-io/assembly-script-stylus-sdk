export enum Visibility {
  PUBLIC = "public",
  PRIVATE = "private",
  INTERNAL = "internal",
  EXTERNAL = "external",
}

export enum StateMutability {
  PURE = "pure",
  VIEW = "view",
  NONPAYABLE = "nonpayable",
  PAYABLE = "payable",
}

export const ABI_ITEM_TYPES = ["function", "constructor"];

export type AbiItemType = (typeof ABI_ITEM_TYPES)[number];

export enum AbiType {
  Bool = "bool",
  String = "string",
  Address = "address",
  Uint256 = "uint256",
  Int256 = "int256",
  Bytes32 = "bytes32",
  Bytes = "bytes",
  Struct = "struct",
  Array = "array",
  Tuple = "tuple",
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
  I256 = "int256",
  Pointer = "usize",
}

export type AbiComponent = {
  name: string;
  type: AbiType | string;
};

export type AbiInput = {
  name: string;
  type: AbiType;
  components?: AbiComponent[];
  originalType?: string;
};

export type AbiOutput = {
  name?: string;
  type: AbiType;
  components?: AbiComponent[];
  originalType?: string;
};

export type AbiItem = {
  name?: string;
  type: AbiItemType;
  stateMutability: StateMutability;
  inputs: AbiInput[];
  outputs: AbiOutput[];
};
