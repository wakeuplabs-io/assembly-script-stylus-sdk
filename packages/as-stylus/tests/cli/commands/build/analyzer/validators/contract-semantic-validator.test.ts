import { Project, SourceFile } from "ts-morph";

import { ContractSemanticValidator } from "../../../../../../cli/commands/build/analyzers/contract/semantic-validator";
import { ErrorManager } from "../../../../../../cli/commands/build/analyzers/shared/error-manager";
describe("SemanticValidator", () => {
  let project: Project;
  let sourceFile: SourceFile;
  let validator: ContractSemanticValidator;
  let errorManager: ErrorManager;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
    errorManager = new ErrorManager();
  });
  describe("validateSourceFile", () => {
    it("should throw error when no contract class is found", () => {
      sourceFile = project.createSourceFile(
        "test.ts",
        `
        class NotAContract {
          constructor() {}
        }
        `,
      );
      validator = new ContractSemanticValidator(sourceFile, errorManager);
      const result = validator.validate();
      expect(result).toBeNull();
      expect(errorManager.getErrors()).toHaveLength(1);
      expect(errorManager.getErrors()[0].message).toBe(
        "No class decorated with @Contract was found",
      );
    });
    it("should return the contract class when found", () => {
      sourceFile = project.createSourceFile(
        "test.ts",
        `
        @Contract
        class MyContract {
          constructor() {}
        }
        `,
      );
      validator = new ContractSemanticValidator(sourceFile, errorManager);
      const result = validator.validate();
      expect(result).toBe(true);
    });
  });
  describe("validateContractClass", () => {
    it("should throw error when multiple constructors are found", () => {
      sourceFile = project.createSourceFile(
        "test.ts",
        `
        @Contract
        class MyContract {
          constructor() {}
          constructor(param: string) {}
        }
        `,
      );
      validator = new ContractSemanticValidator(sourceFile, errorManager);
      const classDecl = sourceFile.getClass("MyContract");
      expect(classDecl).toBeDefined();
      validator.validate();
      expect(errorManager.getErrors()).toHaveLength(1);
      expect(errorManager.getErrors()[0].message).toBe(
        'Contract class "MyContract" has more than one constructor',
      );
    });

    it("should throw error when multiple @Contract are found", () => {
      sourceFile = project.createSourceFile(
        "test.ts",
        `
        @Contract
        @Contract
        class MyContract {
          constructor(param: string) {}
        }
        `,
      );
      errorManager = new ErrorManager();
      validator = new ContractSemanticValidator(sourceFile, errorManager);
      const classDecl = sourceFile.getClass("MyContract");
      expect(classDecl).toBeDefined();

      validator.validate();

      expect(errorManager.getErrors()).toHaveLength(1);
      expect(errorManager.getErrors()[0].message).toBe(
        'Contract class "MyContract" has multiple @Contract decorators',
      );
    });

    it("should validate methods with decorators", () => {
      sourceFile = project.createSourceFile(
        "test.ts",
        `
        @Contract
        class MyContract {
          constructor() {}
          
          @Public
          @View
          static validMethod() {}

          @Public
          @Private
          static invalidMethod() {}
        }
        `,
      );
      validator = new ContractSemanticValidator(sourceFile, errorManager);
      const classDecl = sourceFile.getClass("MyContract");
      expect(classDecl).toBeDefined();
      validator.validate();
      expect(errorManager.getErrors()).toHaveLength(1);
      expect(errorManager.getErrors()[0].message).toBe(
        'Method "invalidMethod" has multiple visibility decorators: Public, Private',
      );
    });

    it("should validate methods with state mutability decorators", () => {
      sourceFile = project.createSourceFile(
        "test.ts",
        `
        @Contract
        class MyContract {
          constructor() {}
          
          @Public
          @View
          @Pure
          static invalidMethod() {}
        }
        `,
      );
      validator = new ContractSemanticValidator(sourceFile, errorManager);
      const classDecl = sourceFile.getClass("MyContract");

      expect(classDecl).toBeDefined();
      validator.validate();
      expect(errorManager.getErrors()).toHaveLength(1);
      expect(errorManager.getErrors()[0].message).toBe(
        'Method "invalidMethod" has multiple mutability decorators: View, Pure',
      );
    });
  });
});
