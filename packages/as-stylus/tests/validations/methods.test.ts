import { Project } from "ts-morph";

import { MethodSemanticValidator } from "@/cli/commands/build/analyzers/method/semantic-validator.js";

import { ErrorManager } from "../../cli/commands/build/analyzers/shared/error-manager.js";

describe("Syntax Validation - Methods", () => {
  let project: Project;
  let errorManager: ErrorManager;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });
    errorManager = new ErrorManager();
  });

  describe("Method Validation", () => {
    describe("Syntax Errors", () => {});

    describe("Semantic Errors", () => {
      it("should detect method with both @External and @View decorators", () => {
        const sourceFile = project.createSourceFile(
          "test.ts",
          "class MyContract { @External @Public static method() {} }",
        );
        const method = sourceFile.getClass("MyContract")!.getMethod("method")!;
        const validator = new MethodSemanticValidator(method, errorManager);
        validator.validate();
        console.log(errorManager.getSemanticErrors());
        expect(errorManager.getSemanticErrors().some((e) => e.code === "S005")).toBe(true);
      });

      it("should detect method with multiple decorators of the same type", () => {
        const sourceFile = project.createSourceFile(
          "test.ts",
          "class MyContract { @View @Pure static method() {} }",
        );
        const method = sourceFile.getClass("MyContract")!.getMethod("method")!;
        console.log(method.getDecorators());
        const validator = new MethodSemanticValidator(method, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().some((e) => e.code === "S006")).toBe(true);
      });

      it("should detect method with invalid return type", () => {
        const sourceFile = project.createSourceFile(
          "test.ts",
          "class MyContract { @Public static method(): InvalidType {} }",
        );
        const method = sourceFile.getClass("MyContract")!.getMethod("method")!;
        const validator = new MethodSemanticValidator(method, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().some((e) => e.code === "S007")).toBe(true);
      });

      it("should detect method with incorrect return type", () => {
        const sourceFile = project.createSourceFile(
          "test.ts",
          "class MyContract { @Public static method(): boolean { return 1; } }",
        );
        const method = sourceFile.getClass("MyContract")!.getMethod("method")!;
        const validator = new MethodSemanticValidator(method, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().some((e) => e.code === "S008")).toBe(true);
      });

      it("should detect method with missing return statement", () => {
        const sourceFile = project.createSourceFile(
          "test.ts",
          "class MyContract { @Public static method(): boolean {} }",
        );
        const method = sourceFile.getClass("MyContract")!.getMethod("method")!;
        const validator = new MethodSemanticValidator(method, errorManager);
        validator.validate();
        expect(errorManager.getSemanticErrors().some((e) => e.code === "S009")).toBe(true);
      });
    });
  });
});
