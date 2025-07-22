import { AbiType } from "@/cli/types/abi.types.js";

export const SUPPORTED_TYPES = [ AbiType.Address, AbiType.Uint256, AbiType.Int256, AbiType.String, AbiType.Bool, AbiType.Void];
export const CONDITIONAL_OPERATORS = [">", ">=", "<", "<=", "==", "!=", "&&", "||"];
export const ARITHMETIC_OPERATORS = ["+", "-", "*", "/", "="];

export type SupportedType = (typeof SUPPORTED_TYPES)[number];