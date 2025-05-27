interface SyntacticError {
  code: string;
  message: (args?: string[]) => string;
  description: string;
  suggestedFix: string;
}

const SYNTACTIC_ERRORS: Record<string, SyntacticError> = {
  // Contract errors
  E001: {
    code: 'E001',
    message: () => 'Source file is empty',
    description: 'The file contains no code.',
    suggestedFix: 'Ensure the file contains valid TypeScript source code.'
  },
  E002: {
    code: 'E002',
    message: () => 'No class declarations found in source file',
    description: 'The file contains no class declarations.',
    suggestedFix: 'Ensure the file contains a class declaration.'
  },
  E003: {
    code: 'E003',
    message: () => 'Class declaration must have a name',
    description: 'The class declaration must have a name.',
    suggestedFix: 'Ensure the class declaration has a name.'
  },
  E004: {
    code: 'E004',
    message: () => 'Only one constructor is allowed per contract class',
    description: 'A class has more than one constructor, which is not valid in TypeScript.',
    suggestedFix: 'Remove extra constructors and consolidate logic into one.'
  },
  // Method errors
  E005: {
    code: 'E005',
    message: () => 'Method must have a name',
    description: 'The method must have a name.',
    suggestedFix: 'Ensure the method has a name.'
  },
};

export default SYNTACTIC_ERRORS;