import { Identifier } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { Variable } from "@/cli/types/ir.types.js";

import { SymbolTableStack } from "../shared/symbol-table.js";
import { parseThis } from "../shared/utils/parse-this.js";

export function buildVariableIR(id: Identifier, symbolTable: SymbolTableStack): Variable {
  const [name] = parseThis(id.getText()).split(".");
  const variable = symbolTable.lookup(name);

  return {
    kind: "var",
    name: name,
    type: variable?.type ?? AbiType.Void,
    originalType: variable?.dynamicType,
    scope: variable?.scope ?? "memory",
  };
}
