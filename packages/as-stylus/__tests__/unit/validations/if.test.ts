import { Project } from "ts-morph";

import { ContractIRBuilder } from "@/cli/commands/build/analyzers/contract/ir-builder.js";
import { AnalysisContextFactory } from "@/cli/commands/build/analyzers/shared/analysis-context-factory.js";

describe("if", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
    });

    AnalysisContextFactory.reset();
  });

  it("should validate if statement", () => {
    const sourceFile = project.createSourceFile(
      "test.ts",
      `
      @Contract
      class MyContract { 
        @Public static method() {
          if (true) {
            Counter.counter = Counter.counter.add(U256Factory.fromString("1"));
          }

          if (false) {
            Counter.counter = Counter.counter.add(U256Factory.fromString("1"));
          }

          let flag: boolean = true;
          if (flag) Counter.counter = Counter.counter.add(U256Factory.fromString("1"));

          let a: U256 = U256Factory.fromString("1");
          let b: U256 = U256Factory.fromString("2");

          if (a.greaterThan(b)) {
            Counter.counter = Counter.counter.add(U256Factory.fromString("1"));
          }
        }
      }`,
    );

    const analyzer = new ContractIRBuilder(sourceFile, "MyContract");
    analyzer.validateAndBuildIR();

    const errorManager = analyzer.errorManager;

    expect(errorManager.getErrors().length).toBe(0);
  });
});
