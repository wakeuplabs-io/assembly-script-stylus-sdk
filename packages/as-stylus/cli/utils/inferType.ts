// Infer type from expression

import {
  SUPPORTED_TYPES,
  SupportedType,
} from "../commands/build/analyzers/shared/supported-types.js";
import { SymbolTableStack } from "../commands/build/analyzers/shared/symbol-table.js";
import { parseThis } from "../commands/build/analyzers/shared/utils/parse-this.js";
import { extractStructName } from "../commands/build/analyzers/struct/struct-utils.js";
import { convertType } from "../commands/build/builder/build-abi.js";
import { AbiType } from "../types/abi.types.js";

export function inferType(symbolTable: SymbolTableStack, target: string): AbiType {
  if (target.startsWith("U256Factory")) {
    return AbiType.Uint256;
  }

  if (target.startsWith("I256Factory")) {
    return AbiType.Int256;
  }

  if (target === "U256") {
    return AbiType.Uint256;
  }

  if (target === "I256") {
    return AbiType.Int256;
  }

  if (target === "Address") {
    return AbiType.Address;
  }

  if (target === "Str") {
    return AbiType.String;
  }

  if (target.startsWith("AddressFactory")) {
    return AbiType.Address;
  }

  if (target.startsWith("StrFactory")) {
    return AbiType.String;
  }

  if (target.startsWith("StructFactory")) {
    const structName = target.split("<")[1].split(">")[0];
    return structName as SupportedType;
  }

  if (/^MappingNested(<|$)/.test(target)) {
    return AbiType.MappingNested;
  }

  if (/^Mapping(<|$)/.test(target)) {
    return AbiType.Mapping;
  }
  if (target.startsWith("Struct<") && target.endsWith(">")) {
    const innerTypeWithImport = target.slice(7, -1);
    const cleanStructName = extractStructName(innerTypeWithImport);
    return cleanStructName as SupportedType;
  }

  if (SUPPORTED_TYPES.includes(convertType(symbolTable, target))) {
    return convertType(symbolTable, target);
  }

  const [structName, propertyName] = parseThis(target).split(".");
  const variable = symbolTable.lookup(structName);
  const struct = symbolTable.getStructTemplateByName(variable?.dynamicType ?? "");

  if (struct && propertyName) {
    const field = struct.fields.find((field) => field.name === propertyName);
    if (field) {
      return field.type as SupportedType;
    }
    return AbiType.Any;
  }

  return AbiType.Any;
}
