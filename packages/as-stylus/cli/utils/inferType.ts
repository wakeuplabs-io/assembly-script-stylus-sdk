// Infer type from expression

import {
  SUPPORTED_TYPES,
  SupportedType,
} from "../commands/build/analyzers/shared/supported-types.js";
import { extractStructName } from "../commands/build/analyzers/struct/struct-utils.js";
import { convertType } from "../commands/build/builder/build-abi.js";
import { AbiType } from "../types/abi.types.js";

export function inferType(target: string): AbiType {
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
    return AbiType.Struct;
  }

  if (/^Mapping2(<|$)/.test(target)) {
    return AbiType.Mapping2;
  }

  if (/^Mapping(<|$)/.test(target)) {
    return AbiType.Mapping;
  }
  if (target.startsWith("Struct<") && target.endsWith(">")) {
    const innerTypeWithImport = target.slice(7, -1);
    const cleanStructName = extractStructName(innerTypeWithImport);
    console.log(`🔍 inferType: ${target} → ${innerTypeWithImport} → ${cleanStructName}`);
    return cleanStructName as SupportedType;
  }

  if (SUPPORTED_TYPES.includes(convertType(target))) {
    return convertType(target);
  }
  return AbiType.Any;
}
