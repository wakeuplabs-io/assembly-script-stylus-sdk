import { AbiType, AbiInput, AbiOutput, StateMutability, Visibility } from "./abi.types.js";
import { SupportedType } from "../commands/build/analyzers/shared/supported-types.js";
import { SymbolTableStack } from "../commands/build/analyzers/shared/symbol-table.js";

export type IRUnaryExpression = {
  kind: "unary";
  op: string;
  expr: IRExpression;
  type: SupportedType;
  returnType: SupportedType;
};

export type Literal = {
  kind: "literal";
  value: string | number | boolean | null;
  type: SupportedType;
};
export type Variable = {
  kind: "var";
  name: string;
  type: SupportedType;
  originalType?: string;
  scope: "storage" | "memory";
};
export type Call = {
  kind: "call";
  target: string;
  args: IRExpression[];
  type: SupportedType;
  returnType: SupportedType;
  originalType?: string;
  scope: "storage" | "memory";
  context?: "argument" | "assignment" | "return";
  receiver?: IRExpression; // TODO: REVIEW
  metadata?: {
    isStructCreation?: boolean;
    structType?: string;
  };
};
export type Member = {
  kind: "member";
  object: IRExpression;
  property: string;
  type: SupportedType;
  originalType?: string;
};
export type IRExpressionBinary = {
  kind: "binary";
  op: string;
  left: IRExpression;
  right: IRExpression;
  type: SupportedType;
};

export type IRMapGet = {
  kind: "map_get";
  slot: number;
  key: IRExpression;
  keyType: string;
  valueType: string;
  type: AbiType.Mapping;
  returnType: SupportedType;
};

export type IRMapSet = {
  kind: "map_set";
  slot: number;
  key: IRExpression;
  value: IRExpression;
  keyType: string;
  valueType: string;
  type: AbiType.Mapping;
};

export type IRMapGet2 = {
  kind: "map_get2";
  slot: number;
  key1: IRExpression;
  key2: IRExpression;
  keyType1: string;
  keyType2: string;
  valueType: string;
  type: AbiType.MappingNested;
  returnType: SupportedType;
};

export type IRMapSet2 = {
  kind: "map_set2";
  slot: number;
  key1: IRExpression;
  key2: IRExpression;
  value: IRExpression;
  keyType1: string;
  keyType2: string;
  valueType: string;
  type: AbiType.MappingNested;
};

export type ComparisonOperator = "==" | "!=" | "<" | "<=" | ">" | ">=";
export type IRCondition = {
  kind: "condition";
  op?: ComparisonOperator;
  left: IRExpression;
  right?: IRExpression;
  type: AbiType.Bool;
};

export type IRThis = {
  kind: "this";
  type: SupportedType;
};

export type IRInterfaceCast = {
  kind: "interface_cast";
  expression: IRExpression;
  interfaceName: string;
  type: SupportedType;
};

export type ChainedCall = {
  kind: "call";
  target: string;
  baseExpression: IRExpression;
  methodName: string;
  args: IRExpression[];
  type: SupportedType;
  returnType: SupportedType;
  originalType?: string;
  scope: "storage" | "memory";
  context?: "argument" | "assignment" | "return";
  receiver?: IRExpression;
  metadata?: {
    isStructCreation?: boolean;
    structType?: string;
  };
};

export type IRExpression =
  | IRUnaryExpression
  | Literal
  | Variable
  | Call
  | Member
  | IRExpressionBinary
  | IRCondition
  | IRMapGet
  | IRMapSet
  | IRMapGet2
  | IRMapSet2
  | IRThis
  | IRInterfaceCast
  | ChainedCall;

// ───────────────────────
// Statements
// ───────────────────────

export type Assignment = {
  kind: "assign";
  target: string;
  expr: IRExpression;
  scope: "storage" | "memory";
};
export type VariableDeclaration = {
  kind: "let" | "const";
  name: string;
  expr: IRExpression;
  scope: "storage" | "memory";
  type: SupportedType;
};
export type ExpressionStatement = { kind: "expr"; expr: IRExpression; type: SupportedType };
export type Return = { kind: "return"; expr?: IRExpression; type: SupportedType };
export type If = { kind: "if"; condition: IRCondition; then: IRStatement[]; else?: IRStatement[] };
export type For = {
  kind: "for";
  init?: IRStatement;
  condition?: IRCondition | IRExpression;
  update?: IRExpression;
  body: IRStatement[];
};
export type DoWhile = {
  kind: "do_while";
  body: IRStatement[];
  condition: IRCondition | IRExpression;
};
export type While = {
  kind: "while";
  condition: IRCondition | IRExpression;
  body: IRStatement[];
};
export type Block = { kind: "block"; body: IRStatement[] };

export type IRStatement =
  | Assignment
  | VariableDeclaration
  | ExpressionStatement
  | Return
  | If
  | For
  | DoWhile
  | While
  | Block
  | IRRevert;

// ───────────────────────
// Variables (storage)
// ───────────────────────

export interface IRSimpleVar {
  name: string;
  type: AbiType | string;
  originalType?: string;
  slot: number;
  kind: "simple";
}

export type IRMappingVar = {
  name: string;
  type: AbiType.Mapping;
  slot: number;
  keyType: string;
  valueType: string;
  kind: "mapping";
};
export type IRMappingNestedVar = {
  name: string;
  type: AbiType.MappingNested;
  slot: number;
  keyType1: string;
  keyType2: string;
  valueType: string;
  kind: "mapping2";
};

export type IRVariable = IRSimpleVar | IRMappingVar | IRMappingNestedVar;

// ───────────────────────
// Contract structure
// ───────────────────────

export type IRArgument = { name: string; type: AbiType; originalType?: string };

export type IRMethod = {
  name: string;
  visibility: Visibility;
  stateMutability: StateMutability;
  inputs: AbiInput[];
  outputs: AbiOutput[];
  ir: IRStatement[];
};

export type IRConstructor = {
  inputs: AbiInput[];
  ir: IRStatement[];
};

// ───────────────────────
// Event structure
// ───────────────────────

export interface IREventField {
  name: string;
  type: string;
  indexed: boolean;
}

export interface IREvent {
  name: string;
  fields: IREventField[];
}

export interface IRStructField {
  name: string;
  type: string;
  offset: number;
  size: number;
  dynamic: boolean;
}

export interface IRStruct {
  name: string;
  fields: IRStructField[];
  size: number;
  dynamic: boolean;
  alignment: number;
}

export interface IRErrorField {
  name: string;
  type: string;
}

export interface IRErrorDecl {
  node: "ErrorDeclNode";
  name: string;
  selector: string;
  fields: IRErrorField[];
}

export type IRRevert = {
  kind: "revert";
  error: string;
  args: IRExpression[];
};

export interface IRContract {
  path: string;
  name: string;
  parent?: IRContract;
  methods: IRMethod[];
  constructor?: IRMethod;
  storage: IRVariable[];
  events?: IREvent[];
  structs?: IRStruct[];
  errors?: IRErrorDecl[];
  symbolTable: SymbolTableStack;
}
