export const SUPPORTED_TYPES = ["U256", "string", "boolean", "Address", "void", "Str"];
export const CONDITIONAL_OPERATORS = [">", ">=", "<", "<=", "==", "!=", "&&", "||"];
export const ARITHMETIC_OPERATORS = ["+", "-", "*", "/", "="];
export type SupportedType = (typeof SUPPORTED_TYPES)[number];