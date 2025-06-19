// Infer type from expression

import {
  SUPPORTED_TYPES,
  SupportedType,
} from "../commands/build/analyzers/shared/supported-types.js";

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
    return "string";
  }

  if (/^Mapping2(<|$)/.test(target)) {
    return "mapping2";
  }

  if (/^Mapping(<|$)/.test(target)) {
    return "mapping";
  }

  return "any";
}
