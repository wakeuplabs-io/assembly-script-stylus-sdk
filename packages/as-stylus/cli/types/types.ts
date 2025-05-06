export const VISIBILITY_DECORATORS = ["public", "private", "internal", "external"];
export type Visibility = typeof VISIBILITY_DECORATORS[number];

export const STATE_MUTABILITY_DECORATORS = ["pure", "view", "nonpayable", "payable"];
export type StateMutability = typeof STATE_MUTABILITY_DECORATORS[number];

export const ABI_ITEM_TYPES = ["function", "constructor"];
export type AbiItemType = typeof ABI_ITEM_TYPES[number];

export type AbiInput = {
  name: string;
  type: string;
};

export type AbiOutput = {
  name?: string;
  type: string;
};

export type AnalyzedMethod = {
  name: string;
  visibility: Visibility;
  method: import("ts-morph").MethodDeclaration;
  stateMutability: StateMutability
  inputs: AbiInput[];
  outputs: AbiOutput[];
};

export type AnalyzedConstructor = {
  inputs: AbiInput[];
  constructor: import("ts-morph").ConstructorDeclaration;
};

export type AnalyzedContract = {
  name: string;
  methods: AnalyzedMethod[];
  constructor?: AnalyzedConstructor
}

export type AbiItem = {
  name?: string;
  type: AbiItemType;
  stateMutability: StateMutability;
  inputs: AbiInput[];
  outputs: AbiOutput[];
};