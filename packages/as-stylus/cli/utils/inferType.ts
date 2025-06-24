// Infer type from expression

import {
  SUPPORTED_TYPES,
  SupportedType,
} from "../commands/build/analyzers/shared/supported-types.js";
import { extractStructName } from "../commands/build/analyzers/struct/struct-utils.js";

export function inferType(target: string): SupportedType {
  if (SUPPORTED_TYPES.includes(target as SupportedType)) {
    return target as SupportedType;
  }

  if (target.startsWith("U256Factory")) {
    return "U256";
  }

  if (target.startsWith("AddressFactory")) {
    return "address";
  }

  if (target.startsWith("StrFactory")) {
    return "Str";
  }

  if (/^Mapping2(<|$)/.test(target)) {
    return "mapping2";
  }

  if (/^Mapping(<|$)/.test(target)) {
    return "mapping";
  }

  if (target.startsWith("Struct<") && target.endsWith(">")) {
    const innerTypeWithImport = target.slice(7, -1);
    const cleanStructName = extractStructName(innerTypeWithImport);
    console.log(`🔍 inferType: ${target} → ${innerTypeWithImport} → ${cleanStructName}`);
    return cleanStructName as SupportedType;
  }

  return "any";
}
