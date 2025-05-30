import { Project, SourceFile } from "ts-morph";

import { ConstructorSemanticValidator } from "@/cli/commands/build/analyzers/constructor/semantic-validator.js";
import { ContractSyntaxValidator } from "@/cli/commands/build/analyzers/contract/syntax-validator.js";
import { ErrorManager } from "@/cli/commands/build/analyzers/shared/error-manager.js";
import { ERROR_CODES } from "@/cli/commands/build/errors/codes.js";

describe("Syntax Validation - Constructor", () => {
  let project: Project;
  let errorManager: ErrorManager;
  let sourceFile: SourceFile;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
    errorManager = new ErrorManager();
  });

  describe("Constructor Validation", () => {
    describe("Syntax Errors", () => {
      it("should detect multiple constructors in a class", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @contract
          class MyContract {
            constructor() {
              // first constructor
            }
            constructor(x: number) {
              // second constructor
            }
          }
          `,
        );
        const validator = new ContractSyntaxValidator(sourceFile, errorManager);
        validator.validate();
        expect(
          errorManager
            .getSyntaxErrors()
            .some((e) => e.code === ERROR_CODES.MULTIPLE_CONSTRUCTORS_FOUND),
        ).toBe(true);
      });
    });

    describe("Semantic Errors", () => {
      it("should detect private constructor", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @contract
          class MyContract {
            private constructor() {
              // private constructor
            }
          }
          `,
        );
        const constructor = sourceFile.getClass("MyContract")!.getConstructors()[0];
        const validator = new ConstructorSemanticValidator(constructor, errorManager);
        validator.validate();
        expect(
          errorManager.getSemanticErrors().some((e) => e.code === ERROR_CODES.NO_CONSTRUCTOR_FOUND),
        ).toBe(true);
      });

      it("should detect protected constructor", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @contract
          class MyContract {
            protected constructor() {
              // protected constructor
            }
          }
          `,
        );
        const constructor = sourceFile.getClass("MyContract")!.getConstructors()[0];
        const validator = new ConstructorSemanticValidator(constructor, errorManager);
        validator.validate();
        expect(
          errorManager.getSemanticErrors().some((e) => e.code === ERROR_CODES.NO_CONSTRUCTOR_FOUND),
        ).toBe(true);
      });

      it("should accept public constructor", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @contract
          class MyContract {
            public constructor() {
              // public constructor
            }
          }
          `,
        );
        const constructor = sourceFile.getClass("MyContract")!.getConstructors()[0];
        const validator = new ConstructorSemanticValidator(constructor, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().length).toBe(0);
      });

      it("should accept constructor with no access modifier", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @contract
          class MyContract {
            constructor() {
              // no access modifier
            }
          }
          `,
        );
        const constructor = sourceFile.getClass("MyContract")!.getConstructors()[0];
        const validator = new ConstructorSemanticValidator(constructor, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().length).toBe(0);
      });
    });
  });
});
