import { Project, SourceFile } from "ts-morph";

import { ContractIRBuilder } from "@/cli/commands/build/analyzers/contract/ir-builder.js";
import { AnalysisContextFactory } from "@/cli/commands/build/analyzers/shared/analysis-context-factory.js";
import { ERROR_CODES } from "@/cli/commands/build/errors/codes.js";

describe("Syntax Validation - Constructor", () => {
  let project: Project;
  let sourceFile: SourceFile;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
    AnalysisContextFactory.reset();
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

        const analyzer = new ContractIRBuilder(sourceFile);
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;

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
        const analyzer = new ContractIRBuilder(sourceFile);
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(
          errorManager.getSemanticErrors().some((e) => e.code === ERROR_CODES.NO_CONSTRUCTOR_FOUND),
        ).toBe(true);
      });

      it("should detect protected constructor", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @Contract
          class MyContract {
            protected constructor() {
              // protected constructor
            }
          }
          `,
        );
        const analyzer = new ContractIRBuilder(sourceFile);
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(
          errorManager.getSemanticErrors().some((e) => e.code === ERROR_CODES.NO_CONSTRUCTOR_FOUND),
        ).toBe(true);
      });

      it("should accept public constructor", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @Contract
          class MyContract {
            public constructor() {
              // public constructor
            }
          }
          `,
        );
        const analyzer = new ContractIRBuilder(sourceFile);
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(errorManager.getSemanticErrors().length).toBe(0);
      });

      it("should accept constructor with no access modifier", () => {
        sourceFile = project.createSourceFile(
          "test.ts",
          `
          @Contract
          class MyContract {
            constructor() {
              // no access modifier
            }
          }
          `,
        );
        const analyzer = new ContractIRBuilder(sourceFile);
        analyzer.validateAndBuildIR();

        const errorManager = analyzer.errorManager;
        expect(errorManager.getSemanticErrors().length).toBe(0);
      });
    });
  });
});
