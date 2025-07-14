import { Project } from "ts-morph";

import { ContractIRBuilder } from "@/cli/commands/build/analyzers/contract/ir-builder.js";
import { AnalysisContextFactory } from "@/cli/commands/build/analyzers/shared/analysis-context-factory.js";
import { ERROR_CODES } from "@/cli/commands/build/errors/codes.js";

describe("Syntax Validation - Contract", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
    AnalysisContextFactory.reset();
  });

  describe("Contract Validation", () => {
    describe("Syntax Errors", () => {
      it("should detect empty source file", () => {
        const sourceFile = project.createSourceFile("test.ts", "");
        const analyzer = new ContractIRBuilder(sourceFile, "MyContract");
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(
          errorManager
            .getSyntaxErrors()
            .some((e: { code: string }) => e.code === ERROR_CODES.EMPTY_SOURCE_FILE),
        ).toBe(true);
      });

      it("should detect missing class declarations", () => {
        const sourceFile = project.createSourceFile("test.ts", "const x = 1;");
        const analyzer = new ContractIRBuilder(sourceFile, "MyContract");
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(
          errorManager
            .getSyntaxErrors()
            .some((e: { code: string }) => e.code === ERROR_CODES.NO_CLASSES_FOUND),
        ).toBe(true);
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
        const analyzer = new ContractIRBuilder(sourceFile, "MyContract");
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(
          errorManager
            .getSemanticErrors()
            .some((e: { code: string }) => e.code === ERROR_CODES.NO_CONTRACT_DECORATOR_FOUND),
        ).toBe(true);
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
        const analyzer = new ContractIRBuilder(sourceFile, "MyContract");
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(
          errorManager
            .getSemanticErrors()
            .some((e: { code: string }) => e.code === ERROR_CODES.MULTIPLE_CONTRACTS_FOUND),
        ).toBe(true);
      });
    });
  });
});
