import { SourceFile, ClassDeclaration, MethodDeclaration, PropertyDeclaration } from "ts-morph";

export class SyntaxValidator {
  private sourceFile: SourceFile;
  private prefix: string;

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
    const fileName = sourceFile.getFilePath().split("/").pop()?.split(".")[0] ?? "";
    this.prefix = `[syntax] [${fileName}]`;
  }

  validateSourceFile(): void {
    if (this.sourceFile.getFullText().trim().length === 0) {
      throw new Error(`${this.prefix} Source file is empty`);
    }

    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      throw new Error(`${this.prefix} No class declarations found in source file`);
    }

    for (const classDecl of classes) {
      this.validateClass(classDecl);
    }
  }

  private validateClass(classDecl: ClassDeclaration): void {
    if (!classDecl.getName()) {
      throw new Error(`${this.prefix} Class declaration must have a name`);
    }

    for (const method of classDecl.getMethods()) {
      this.validateMethod(method);
    }

    for (const prop of classDecl.getProperties()) {
      this.validateProperty(prop);
    }
  }

  private validateMethod(method: MethodDeclaration): void {
    if (!method.getName()) {
      throw new Error(`${this.prefix} Method declaration must have a name`);
    }

    if (!method.isAbstract() && !method.getBody()) {
      throw new Error(`${this.prefix} Method "${method.getName()}" must have a body`);
    }

    for (const param of method.getParameters()) {
      if (!param.getType().getText()) {
        throw new Error(`${this.prefix} Parameter "${param.getName()}" in method "${method.getName()}" must have a type`);
      }
    }
  }

  private validateProperty(prop: PropertyDeclaration): void {
    if (!prop.getName()) {
      throw new Error(`${this.prefix} Property declaration must have a name`);
    }

    if (!prop.getType().getText()) {
      throw new Error(`${this.prefix} Property "${prop.getName()}" must have a type`);
    }
  }
} 