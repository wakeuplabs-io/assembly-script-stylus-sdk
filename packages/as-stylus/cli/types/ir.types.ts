import { AbiVisibility, AbiStateMutability, AbiInput, AbiOutput } from "./abi.types";

export type IRStatement =
  | { kind: "let"; name: string; expr: IRExpression }
  | { kind: "assign"; target: string; expr: IRExpression }
  | { kind: "expr"; expr: IRExpression }
  | { kind: "return"; expr: IRExpression }
  | { kind: "if"; condition: IRExpression; then: IRStatement[]; else?: IRStatement[] }
  | { kind: "block"; body: IRStatement[] };

// Expresiones
export type IRExpression =
  | { kind: "literal"; value: string | number | boolean }
  | { kind: "var"; name: string }
  | { kind: "call"; target: string; args: IRExpression[] }
  | { kind: "member"; object: IRExpression; property: string }
  | { kind: "binary"; op: string; left: IRExpression; right: IRExpression }; 

export type IRMethod = {
    name: string;
    visibility: AbiVisibility;
    stateMutability: AbiStateMutability
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
}