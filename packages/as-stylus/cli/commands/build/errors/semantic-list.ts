import { ERROR_CODES } from "./codes.js";

interface SemanticError {
  code: string;
  message: (args: string[]) => string;
  description: string;
  suggestedFix: string;
}

const SEMANTIC_ERRORS: Record<string, SemanticError> = {
  // Contract errors
  [ERROR_CODES.NO_CONTRACT_DECORATOR_FOUND]: {
    code: ERROR_CODES.NO_CONTRACT_DECORATOR_FOUND,
    message: () => 'No contract decorator found',
    description: 'The file contains no contract decorator.',
    suggestedFix: 'Ensure the file contains a contract decorator.'
  },
  [ERROR_CODES.MULTIPLE_CONTRACTS_FOUND]: {
    code: ERROR_CODES.MULTIPLE_CONTRACTS_FOUND,
    message: () => 'Multiple contract classes found',
    description: 'The file contains multiple contract classes.',
    suggestedFix: 'Ensure the file contains only one contract class.'
  },
  [ERROR_CODES.MULTIPLE_CONTRACT_DECORATORS_FOUND]: {
    code: ERROR_CODES.MULTIPLE_CONTRACT_DECORATORS_FOUND,
    message: ([className]: string[]) => `Multiple contract decorators found for class ${className}`,
    description: 'The contract class contains multiple decorators.',
    suggestedFix: 'Ensure the contract class contains only one decorator.'
  },
  [ERROR_CODES.NO_CONSTRUCTOR_FOUND]: {
    code: ERROR_CODES.NO_CONSTRUCTOR_FOUND,
    message: () => 'Constructor must be public or have no access modifier',
    description: 'A private or protected constructor prevents contract instantiation.',
    suggestedFix: 'Use "public" or no access modifier in the constructor.'
  },
  // Method semantic errors
  [ERROR_CODES.MULTIPLE_VISIBILITY_DECORATORS_FOUND]: {
    code: ERROR_CODES.MULTIPLE_VISIBILITY_DECORATORS_FOUND,
    message: ([methodName]: string[]) => `Method "${methodName}" cannot have both @External and @Public decorators`,
    description: 'A method is annotated with both @External and @Public, which is invalid.',
    suggestedFix: 'Use only one of @External or @Public on a method, not both.'
  },
  [ERROR_CODES.MULTIPLE_STATE_MUTABILITY_DECORATORS_FOUND]: {
    code: ERROR_CODES.MULTIPLE_STATE_MUTABILITY_DECORATORS_FOUND,
  message: ([methodName]: string[]) => `Method "${methodName}" has multiple decorators of the same type`,
  description: 'A method contains duplicated decorators of the same kind.',
  suggestedFix: 'Ensure each decorator is applied only once per method.'
  },
  [ERROR_CODES.INVALID_RETURN_TYPE]: {
    code: ERROR_CODES.INVALID_RETURN_TYPE,
    message: ([methodName]: string[]) => `@View method "${methodName}" must return a serializable value`,
    description: 'A method marked with @View returns a non-serializable value.',
    suggestedFix: 'Ensure the method returns a primitive or serializable object.'
  },
  // TODO: missing implementation
  [ERROR_CODES.RETURN_TYPE_MISMATCH]: {
    code: ERROR_CODES.RETURN_TYPE_MISMATCH,
    message: ([methodName, actual, expected]: string[]) =>
      `Method "${methodName}" returns type "${actual}" which is incompatible with declared type "${expected}"`,
    description: 'Return type mismatch between declared and actual value.',
    suggestedFix: 'Ensure the return value matches the method’s declared type.'
  },
  [ERROR_CODES.METHOD_HAS_NO_ACCESS_MODIFIER]: {
    code: ERROR_CODES.METHOD_HAS_NO_ACCESS_MODIFIER,
    message: ([methodName]: string[]) => `Method "${methodName}" is missing a return statement`,
    description: 'The method declares a return type but does not return a value.',
    suggestedFix: 'Add a return statement with the expected type.'
  },
  [ERROR_CODES.METHOD_NAME_ALREADY_EXISTS]: {
    code: ERROR_CODES.METHOD_NAME_ALREADY_EXISTS,
    message: ([methodName]: string[]) => `Method "${methodName}" has duplicate name in class`,
    description: 'A method has the same name as another method in the same class.',
    suggestedFix: 'Rename the method to avoid conflicts.'
  }
};

export default SEMANTIC_ERRORS;