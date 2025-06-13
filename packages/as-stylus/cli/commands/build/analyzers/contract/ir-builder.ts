import { SourceFile, ConstructorDeclaration } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { IRContract } from "@/cli/types/ir.types.js";

import { ContractSemanticValidator } from "./semantic-validator.js";
import { ContractSyntaxValidator } from "./syntax-validator.js";
import { ConstructorIRBuilder } from "../constructor/ir-builder.js";
import { MethodIRBuilder } from "../method/ir-builder.js";
import { PropertyIRBuilder } from "../property/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class ContractIRBuilder extends IRBuilder<IRContract> {
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile) {
    super(sourceFile);
    this.sourceFile = sourceFile;
  }

  validate(): boolean {
    const syntaxValidator = new ContractSyntaxValidator(this.sourceFile);
    const semanticValidator = new ContractSemanticValidator(this.sourceFile);

    const syntaxErrors = syntaxValidator.validate();
    const semanticErrors = semanticValidator.validate();

    return syntaxErrors || semanticErrors;
  }

  buildIR(): IRContract {
    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      return {
        name: "Main",
        constructor: undefined,
        methods: [],
        storage: [],
      };
    }

    const classDefinition = classes[0];
    const name = classDefinition.getName();

    const constructorDecl: ConstructorDeclaration =
      classDefinition.getConstructors()[0];
    let constructor;
    if(constructorDecl) {
      const constructorIRBuilder = new ConstructorIRBuilder(constructorDecl);
      constructor = constructorIRBuilder.validateAndBuildIR();
    }

    const names = classDefinition.getMethods().map(method => method.getName());

    const storage = classDefinition.getProperties().map((property, index) => {
      const propertyIRBuilder = new PropertyIRBuilder(property, index);
      return propertyIRBuilder.validateAndBuildIR();
    });

    for (const v of storage) {
      ctx.slotMap.set(`${name}.${v.name}`, v.slot);
    }

    const methods = classDefinition.getMethods().map((method) => {
      const methodIRBuilder = new MethodIRBuilder(method, names);
      return methodIRBuilder.validateAndBuildIR();
    });

    return {
      name: name ?? "Main",
      constructor,
      methods,
      storage,
    };
  }
}
