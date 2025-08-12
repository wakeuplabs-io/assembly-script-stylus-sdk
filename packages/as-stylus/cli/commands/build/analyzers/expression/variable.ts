
import { Identifier } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { SymbolTableStack } from "../shared/symbol-table.js";
import { parseThis } from "../shared/utils/parse-this.js";

export function buildVariableIR(id: Identifier, symbolTable: SymbolTableStack): IRExpression {
  const [name] = parseThis(id.getText()).split(".");
  const variable = symbolTable.lookup(name);
  return { kind: "var", name: name, type: variable?.type ?? AbiType.Void, scope: variable?.scope ?? "memory" };
}