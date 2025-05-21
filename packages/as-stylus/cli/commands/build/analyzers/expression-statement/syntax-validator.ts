import { ExpressionStatement, SyntaxKind, BinaryExpression, Identifier, SymbolFlags } from "ts-morph";
import { ErrorManager } from "../shared/error-manager";

export class ExpressionStatementSyntaxValidator {
  private statement: ExpressionStatement;
  private errorManager: ErrorManager;
  private filePath: string;

  constructor(statement: ExpressionStatement, errorManager: ErrorManager) {
    this.statement = statement;
    this.errorManager = errorManager;
    this.filePath = statement.getSourceFile().getFilePath();
  }

  validate(): boolean {
    const expr = this.statement.getExpression();
    let hasError = false;

    // Handle assignment expressions (x = y)
    if (expr.getKind() === SyntaxKind.BinaryExpression) {
      const bin = expr as BinaryExpression;
      if (bin.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
        const lhsNode = bin.getLeft();
        
        // Validate that LHS is an identifier
        if (lhsNode.getKind() !== SyntaxKind.Identifier) {
          this.errorManager.addSyntaxError(
            "Left-hand side of assignment must be an identifier",
            this.filePath,
            this.statement.getEndLineNumber()
          );
          hasError = true;
        }

        // Validate that the identifier is not a constant
        const lhsId = lhsNode as Identifier;
        const symbol = lhsId.getSymbol();
        if (symbol && symbol.getFlags() & SymbolFlags.ConstEnum) {
          this.errorManager.addSyntaxError(
            "Cannot assign to a constant variable",
            this.filePath,
            lhsId.getEndLineNumber()
          );
          hasError = true;
        }
      }
    }

    return !hasError;
  }
} 