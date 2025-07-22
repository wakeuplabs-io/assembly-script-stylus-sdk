import { AbiType } from "../types/abi.types.js";

export function getReturnSize(type: AbiType): number {
  switch (type) {
    case AbiType.Uint256:
      return 32;
    case AbiType.Address:
      return 32;
    case AbiType.Bool:
      return 32;
    case AbiType.String:
      return 32;
    default:
      return 32;
  }
}
