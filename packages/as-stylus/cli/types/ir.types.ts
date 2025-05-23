import { AbiVisibility, AbiStateMutability, AbiInput, AbiOutput } from "@/cli/types/abi.types.js";

// Statements
export type Let = { kind: "let"; name: string; expr: IRExpression };
export type Assignment = { kind: "assign"; target: string; expr: IRExpression };
export type ExpressionStatement = { kind: "expr"; expr: IRExpression };
export type Return = { kind: "return"; expr: IRExpression };
export type If = { kind: "if"; condition: IRExpression; then: IRStatement[]; else?: IRStatement[] };
export type Block = { kind: "block"; body: IRStatement[] };

export type IRStatement = Let | Assignment | ExpressionStatement | Return | If | Block;

// Expressions
export type Literal = { kind: "literal"; value: string | number | boolean | null };
export type Variable = { kind: "var"; name: string };
export type Call = { kind: "call"; target: string; args: IRExpression[] };
export type Member = { kind: "member"; object: IRExpression; property: string };
export type Binary = { kind: "binary"; op: string; left: IRExpression; right: IRExpression };
export type IRExpression = Literal | Variable | Call | Member | Binary;

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

export type IRVariable = {
  name: string;
  type: string;
  slot: number;
};

export type IRContract = {
  name: string;
  methods: IRMethod[];
  constructor?: IRConstructor;
  storage: IRVariable[];
};
