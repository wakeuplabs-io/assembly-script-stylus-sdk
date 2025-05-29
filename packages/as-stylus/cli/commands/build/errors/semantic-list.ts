interface SemanticError {
  code: string;
  message: (args: string[]) => string;
  description: string;
  suggestedFix: string;
}

const SEMANTIC_ERRORS: Record<string, SemanticError> = {
  // Contract errors
  S001: {
    code: 'S001',
    message: () => 'No contract class found',
    description: 'The file contains no contract class.',
    suggestedFix: 'Ensure the file contains a contract class.'
  },
  S002: {
    code: 'S002',
    message: () => 'Multiple contract classes found',
    description: 'The file contains multiple contract classes.',
    suggestedFix: 'Ensure the file contains only one contract class.'
  },
  S003: {
    code: 'S003',
    message: ([className]: string[]) => `Multiple contract decorators found for class ${className}`,
    description: 'The contract class contains multiple decorators.',
    suggestedFix: 'Ensure the contract class contains only one decorator.'
  },
  S004: {
    code: 'S004',
    message: () => 'Constructor must be public or have no access modifier',
    description: 'A private or protected constructor prevents contract instantiation.',
    suggestedFix: 'Use "public" or no access modifier in the constructor.'
  },
  // Method semantic errors
  S005: {
    code: 'S005',
    message: ([methodName]: string[]) => `Method "${methodName}" cannot have both @External and @Public decorators`,
    description: 'A method is annotated with both @External and @Public, which is invalid.',
    suggestedFix: 'Use only one of @External or @Public on a method, not both.'
  },
  S006: {
    code: 'S006',
  message: ([methodName]: string[]) => `Method "${methodName}" has multiple decorators of the same type`,
  description: 'A method contains duplicated decorators of the same kind.',
  suggestedFix: 'Ensure each decorator is applied only once per method.'
  },
  S007: {
    code: 'S007',
    message: ([methodName]: string[]) => `@View method "${methodName}" must return a serializable value`,
    description: 'A method marked with @View returns a non-serializable value.',
    suggestedFix: 'Ensure the method returns a primitive or serializable object.'
  },
  // TODO: missing implementation
  S008: {
    code: 'S008',
    message: ([methodName, actual, expected]: string[]) =>
      `Method "${methodName}" returns type "${actual}" which is incompatible with declared type "${expected}"`,
    description: 'Return type mismatch between declared and actual value.',
    suggestedFix: 'Ensure the return value matches the method’s declared type.'
  },
  //TODO: missing implementation
  S009: {
    code: 'S009',
    message: ([methodName]: string[]) => `Method "${methodName}" is missing a return statement`,
    description: 'The method declares a return type but does not return a value.',
    suggestedFix: 'Add a return statement with the expected type.'
  },
  S010: {
    code: 'S010',
    message: ([methodName]: string[]) => `Method "${methodName}" has duplicate name in class`,
    description: 'A method has the same name as another method in the same class.',
    suggestedFix: 'Rename the method to avoid conflicts.'
  }
};

export default SEMANTIC_ERRORS;