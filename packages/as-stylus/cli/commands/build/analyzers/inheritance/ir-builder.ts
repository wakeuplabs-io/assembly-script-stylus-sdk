import path from "path";
import { ClassDeclaration, SourceFile, HeritageClause, SyntaxKind } from "ts-morph";

import { IRContract } from "@/cli/types/ir.types.js";

import { BuildRunner } from "../../build-runner.js";
import { ERROR_CODES } from "../../errors/codes.js";
import { IRBuilder } from "../shared/ir-builder.js";

export class InheritanceIRBuilder extends IRBuilder<IRContract | undefined> {
  private sourceFile: SourceFile;
  private parents: string[];

  constructor(sourceFile: SourceFile, contractClass: ClassDeclaration) {
    super(sourceFile);
    this.sourceFile = sourceFile;

    const extendsExpr = contractClass.getHeritageClauses().find(
      (h: HeritageClause) => h.getToken() === SyntaxKind.ExtendsKeyword
    );
    
    const parentTypes = extendsExpr?.getTypeNodes() ?? [];
    this.parents = parentTypes.map((type) => type.getText());
  }

  validate(): boolean {
    if (this.parents.length > 1) {
      this.errorManager.addSemanticError(ERROR_CODES.MULTIPLE_INHERITANCE_NOT_SUPPORTED);
      return false;
    }
    return true;
  }

  private getImportPath(parentType: string): string {
    const imports = this.sourceFile.getImportDeclarations();

    const importPath = imports.find((i) => i.getText().includes(`import { ${parentType} } from`) || i.getText().includes(`import ${parentType} from`));
    
    if (!importPath) {
      return "";
    }

    const match = importPath.getText().match(/from\s+['"]([^'"]+)['"]/);
    
    return (match?.[1] || "").replace(".js", ".ts");
  }

  buildIR(): IRContract | undefined {
    const parentPath = this.getImportPath(this.parents[0]);

    if (!parentPath) {
      return undefined;
    }

    const runner = new BuildRunner(path.resolve(process.cwd()), parentPath, this.errorManager);
    return runner.buildIR()?.ir;
  }
}