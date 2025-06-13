import { AbiVisibility, AbiStateMutability, AbiInput, AbiOutput } from "./abi.types.js";
import { SupportedType } from "../commands/build/analyzers/shared/supported-types.js";

// Statements// ───────────────────────
// Base IR node types
// ───────────────────────

export type Literal = {
  kind: "literal";
  value: string | number | boolean | null;
  type?: SupportedType;
};
export type Variable = { kind: "var"; name: string; type?: SupportedType };
export type Call = { kind: "call"; target: string; args: IRExpression[]; type?: SupportedType };
export type Member = {
  kind: "member";
  object: IRExpression;
  property: string;
  type?: SupportedType;
};
export type IRExpressionBinary = {
  kind: "binary";
  op: string;
  left: IRExpression;
  right: IRExpression;
  type?: SupportedType;
};

// ───────────────────────
// Mapping IR extensions
// ───────────────────────

export type IRMapGet = { kind: "map_get"; slot: number; key: IRExpression };
export type IRMapSet = { kind: "map_set"; slot: number; key: IRExpression; value: IRExpression };
export type IRMapGet2 = { kind: "map_get2"; slot: number; key1: IRExpression; key2: IRExpression };
export type IRMapSet2 = {
  kind: "map_set2";
  slot: number;
  key1: IRExpression;
  key2: IRExpression;
  value: IRExpression;
};

// ───────────────────────
// Conditions
// ───────────────────────

export type ComparisonOperator = "==" | "!=" | "<" | "<=" | ">" | ">=";
export type IRCondition = IRExpressionBinary & { kind: "condition"; op: ComparisonOperator };

// ───────────────────────
// Expressions
// ───────────────────────

export type IRExpression =
  | Literal
  | Variable
  | Call
  | Member
  | IRExpressionBinary
  | IRCondition
  | IRMapGet
  | IRMapSet
  | IRMapGet2
  | IRMapSet2;

// ───────────────────────
// Statements
// ───────────────────────

export type Assignment = { kind: "assign"; target: string; expr: IRExpression };
export type VariableDeclaration = { kind: "let"; name: string; expr: IRExpression };
export type ExpressionStatement = { kind: "expr"; expr: IRExpression };
export type Return = { kind: "return"; expr: IRExpression; valueType?: string };
export type If = { kind: "if"; condition: IRCondition; then: IRStatement[]; else?: IRStatement[] };
export type Block = { kind: "block"; body: IRStatement[] };

export type IRStatement =
  | Assignment
  | VariableDeclaration
  | ExpressionStatement
  | Return
  | If
  | Block;

// ───────────────────────
// Variables (storage)
// ───────────────────────

export type IRSimpleVar = { name: string; type: string; slot: number; kind: "simple" };
export type IRMappingVar = {
  name: string;
  type: "mapping";
  slot: number;
  keyType: string;
  valueType: string;
  kind: "mapping";
};
export type IRMapping2Var = {
  name: string;
  type: "mapping2";
  slot: number;
  keyType1: string;
  keyType2: string;
  valueType: string;
  kind: "mapping2";
};

export type IRVariable = IRSimpleVar | IRMappingVar | IRMapping2Var;

// ───────────────────────
// Contract structure
// ───────────────────────

export type IRArgument = { name: string; type: string };

export type IRMethod = {
  name: string;
  visibility: AbiVisibility;
  stateMutability: AbiStateMutability;
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

export interface IRContract {
  name: string;
  methods: IRMethod[];
  constructor?: IRConstructor;
  storage: IRVariable[];
  events?: IREvent[];
}
