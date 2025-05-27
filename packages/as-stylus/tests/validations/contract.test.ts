import { Project } from "ts-morph";

import { ContractSemanticValidator } from "../../cli/commands/build/analyzers/contract/semantic-validator.js";
import { ContractSyntaxValidator } from "../../cli/commands/build/analyzers/contract/syntax-validator.js";
import { ErrorManager } from "../../cli/commands/build/analyzers/shared/error-manager.js";

describe("Syntax Validation - Contract", () => {
  let project: Project;
  let errorManager: ErrorManager;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
    errorManager = new ErrorManager();
  });

  describe("Contract Validation", () => {
    describe("Syntax Errors", () => {
      it("should detect empty source file", () => {
        const sourceFile = project.createSourceFile("test.ts", "");
        const validator = new ContractSyntaxValidator(sourceFile, errorManager);
        validator.validate();
        expect(errorManager.getSyntaxErrors().some((e) => e.code === "E001")).toBe(true);
      });

      it("should detect missing class declarations", () => {
        const sourceFile = project.createSourceFile("test.ts", "const x = 1;");
        const validator = new ContractSyntaxValidator(sourceFile, errorManager);
        validator.validate();
        expect(errorManager.getSyntaxErrors().some((e) => e.code === "E002")).toBe(true);
      });
    });

    describe("Semantic Errors", () => {
      it("should detect missing contract decorator", () => {
        const sourceFile = project.createSourceFile(
          "test.ts",
          `
          class MyContract {
            @public
            myMethod(): void {}
          }
          `,
        );
        const validator = new ContractSemanticValidator(sourceFile, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().some((e) => e.code === "S001")).toBe(true);
      });

      it("should detect multiple contract classes", () => {
        const sourceFile = project.createSourceFile(
          "test.ts",
          `
          @contract
          class Contract1 {
            @public
            myMethod(): void {}
          }

          @contract
          class Contract2 {
            @public
            myMethod(): void {}
          }
          `,
        );
        const validator = new ContractSemanticValidator(sourceFile, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().some((e) => e.code === "S002")).toBe(true);
      });
    });
  });
});
