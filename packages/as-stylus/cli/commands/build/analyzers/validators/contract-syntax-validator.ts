import { SourceFile, ClassDeclaration, MethodDeclaration, PropertyDeclaration } from "ts-morph";
import { ErrorManager } from "../errors/error-manager.js";

export class SyntaxValidator {
  private sourceFile: SourceFile;
  private errorManager: ErrorManager;

  constructor(sourceFile: SourceFile, errorManager: ErrorManager) {
    this.sourceFile = sourceFile;
    this.errorManager = errorManager;
  }

  validateSourceFile(): void {
    if (this.sourceFile.getFullText().trim().length === 0) {
      this.errorManager.addError(
        "Source file is empty",
        "syntax",
        this.sourceFile.getFilePath(),
        this.sourceFile.getStartLineNumber()
      );
      return;
    }

    const classes = this.sourceFile.getClasses();
    if (classes.length === 0) {
      this.errorManager.addError(
        "No class declarations found in source file",
        "syntax",
        this.sourceFile.getFilePath(),
        this.sourceFile.getStartLineNumber()
      );
      return;
    }

    for (const classDecl of classes) {
      this.validateClass(classDecl);
    }
  }

  private validateClass(classDecl: ClassDeclaration): void {
    if (!classDecl.getName()) {
      this.errorManager.addError(
        "Class declaration must have a name",
        "syntax",
        classDecl.getSourceFile().getFilePath(),
        classDecl.getStartLineNumber()
      );
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
      this.errorManager.addError(
        "Method declaration must have a name",
        "syntax",
        method.getSourceFile().getFilePath(),
        method.getStartLineNumber()
      );
    }

    if (!method.isAbstract() && !method.getBody()) {
      this.errorManager.addError(
        `Method "${method.getName()}" must have a body`,
        "syntax",
        method.getSourceFile().getFilePath(),
        method.getStartLineNumber()
      );
    }

    for (const param of method.getParameters()) {
      if (!param.getType().getText()) {
        this.errorManager.addError(
          `Parameter "${param.getName()}" in method "${method.getName()}" must have a type`,
          "syntax",
          param.getSourceFile().getFilePath(),
          param.getStartLineNumber()
        );
      }
    }
  }

  private validateProperty(prop: PropertyDeclaration): void {
    if (!prop.getName()) {
      this.errorManager.addError(
        "Property declaration must have a name",
        "syntax",
        prop.getSourceFile().getFilePath(),
        prop.getStartLineNumber()
      );
    }

    if (!prop.getType().getText()) {
      this.errorManager.addError(
        `Property "${prop.getName()}" must have a type`,
        "syntax",
        prop.getSourceFile().getFilePath(),
        prop.getStartLineNumber()
      );
    }
  }
} 