/**
 * EmitResult is the result of emitting code for an expression.
 */
export interface EmitResult {
  /**
   * setupLines is an array of strings with code lines that must be executed before using the expression
   * @example
   * let x = 5; // setupLines is ["let x = 5;"]
   */
  setupLines: string[];
  /**
   * valueExpr is the final expression that represents the value
   * @example
   * let x = 5; // valueExpr is "x"
   */
  valueExpr: string;

  /**
   * statementLines is an array of strings with the emitted code for an entire statement
   * @example
   * let x = 5; // statementLines is ["let x = 5;"]
   */
  statementLines?: string[];
  /**
   * valueType is the type of the value (optional, for type checking)
   * @example
   * let x: number = 5; // valueType is "number"
   */
  valueType?: string;
}

/**
 * EmitContext is the context used to emit code for an expression.
 */
export interface EmitContext {
  /**
   * isInStatement indicates if the current expression is inside a statement (true) or not (false)
   * @example
   * let x = 5; // isInStatement is true
   * +x; // isInStatement is false
   */
  isInStatement: boolean;
  /**
   * contractName is the name of the contract being processed
   * @example
   * Contract "Counter" will have contractName "Counter"
   */
  contractName: string;
  /**
   * strCounter is a counter used to generate unique temporary variable names
   * @example
   * let __tmp0 = 5; // strCounter is 0
   * let __tmp1 = 3; // strCounter is 1
   */
  strCounter: number;
  /**
   * ptrCounter is a counter used to generate unique memory pointer names
   * @example
   * let __ptr0 = 5; // ptrCounter is 0
   * let __ptr1 = 3; // ptrCounter is 1
   */
  ptrCounter: number;
}
