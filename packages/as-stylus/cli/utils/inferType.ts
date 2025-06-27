// Infer type from expression

import { SUPPORTED_TYPES } from "../commands/build/analyzers/shared/supported-types.js";
import { convertType } from "../commands/build/builder/build-abi.js";
import { AbiType } from "../types/abi.types.js";

export function inferType(target: string): AbiType {
  if (target.startsWith("U256Factory")) {
    return AbiType.Uint256;
  }

  if (target.startsWith("AddressFactory")) {
    return AbiType.Address;
  }

  if (target.startsWith("StrFactory")) {
    return AbiType.String;
  }

  if (/^Mapping2(<|$)/.test(target)) {
    return AbiType.Mapping2;
  }

  if (/^Mapping(<|$)/.test(target)) {
    return AbiType.Mapping;
  }

  if (SUPPORTED_TYPES.includes(convertType(target))) {
    return convertType(target);
  }
  return AbiType.Any;
}
