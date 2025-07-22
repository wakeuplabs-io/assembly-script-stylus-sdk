import { ERROR_CODES } from "./codes.js";

interface SyntacticError {
  code: string;
  message: (args?: string[]) => string;
  description: string;
  suggestedFix: string;
}

const SYNTACTIC_ERRORS: Record<string, SyntacticError> = {
  // Contract errors
  [ERROR_CODES.EMPTY_SOURCE_FILE]: {
    code: ERROR_CODES.EMPTY_SOURCE_FILE,
    message: () => 'Source file is empty',
    description: 'The file contains no code.',
    suggestedFix: 'Ensure the file contains valid TypeScript source code.'
  },
  [ERROR_CODES.NO_CLASSES_FOUND]: {
    code: ERROR_CODES.NO_CLASSES_FOUND,
    message: () => 'No class declarations found in source file',
    description: 'The file contains no class declarations.',
    suggestedFix: 'Ensure the file contains a class declaration.'
  },
  [ERROR_CODES.CLASS_HAS_NO_NAME]: {
    code: ERROR_CODES.CLASS_HAS_NO_NAME,
    message: () => 'Class declaration must have a name',
    description: 'The class declaration must have a name.',
    suggestedFix: 'Ensure the class declaration has a name.'
  },
  [ERROR_CODES.MULTIPLE_CONSTRUCTORS_FOUND]: {
    code: ERROR_CODES.MULTIPLE_CONSTRUCTORS_FOUND,
    message: () => 'Only one constructor is allowed per contract class',
    description: 'A class has more than one constructor, which is not valid in TypeScript.',
    suggestedFix: 'Remove extra constructors and consolidate logic into one.'
  },
  // Method errors
  [ERROR_CODES.METHOD_HAS_NO_NAME]: {
    code: ERROR_CODES.METHOD_HAS_NO_NAME,
    message: () => 'Method must have a name',
    description: 'The method must have a name.',
    suggestedFix: 'Ensure the method has a name.'
  },
};

export default SYNTACTIC_ERRORS;