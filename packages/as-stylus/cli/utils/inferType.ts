// Infer type from expression

import { SupportedType } from "../commands/build/analyzers/shared/supported-types.js";

export function inferType(target: string): SupportedType {
  if (target.startsWith("U256Factory")) {
    return "U256";
  }

  if (target.startsWith("AddressFactory")) {
    return "address";
  }

  if (target.startsWith("StrFactory")) {
    return "string";
  }

  return "any";
}
