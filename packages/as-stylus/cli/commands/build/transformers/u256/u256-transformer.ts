import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { Call, IRExpression } from "@/cli/types/ir.types.js";
import { MethodName, METHOD_GROUPS } from "@/cli/types/method-types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { ContractContext } from "../core/contract-context.js";
import { TransformerUtils } from "../core/transformer-utils.js";
import { MethodDetectionHelper } from "../core/method-detection-helper.js";
import { TypeExclusionHelper } from "../core/type-exclusion-helper.js";
import { U256ChainedCallHandler } from "./handlers/chained-call-handler.js";
import { U256ComparisonHandler } from "./handlers/comparison-handler.js";
import { U256CopyHandler } from "./handlers/copy-handler.js";
import { U256CreateHandler } from "./handlers/create-handler.js";
import { U256FromStringHandler } from "./handlers/from-string-handler.js";
import { U256FunctionCallHandler } from "./handlers/function-call-handler.js";
import { U256OperationHandler } from "./handlers/operation-handler.js";
import { U256ToStringHandler } from "./handlers/to-string-handler.js";

/** Transforms U256 expressions from TypeScript to AssemblyScript with checked arithmetic and factory methods */
export class U256Transformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "U256");

    this.registerHandler(new U256ChainedCallHandler(contractContext));
    this.registerHandler(new U256CreateHandler(contractContext));
    this.registerHandler(new U256CopyHandler(contractContext));
    this.registerHandler(new U256FromStringHandler(contractContext));
    this.registerHandler(new U256OperationHandler(contractContext));
    this.registerHandler(new U256ComparisonHandler(contractContext));
    this.registerHandler(new U256ToStringHandler(contractContext));
    this.registerHandler(new U256FunctionCallHandler(contractContext));
  }

  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;

    const target = expr.target || "";

    // Early exclusion checks using centralized utilities
    if (TypeExclusionHelper.shouldExcludeExpression(expr)) {
      return false;
    }

    // Handle chained factory calls (e.g., U256Factory.fromString().add())
    if (expr.receiver && expr.receiver.kind === "call") {
      const receiverTarget = expr.receiver.target || "";
      const receiverReceiver = expr.receiver.receiver;

      if (
        receiverTarget === "fromString" &&
        receiverReceiver &&
        receiverReceiver.kind === "var" &&
        receiverReceiver.name === "U256Factory"
      ) {
        const u256ChainableMethods: string[] = [
          ...METHOD_GROUPS.ARITHMETIC,
          ...METHOD_GROUPS.COMPARISON,
        ];
        return u256ChainableMethods.includes(target);
      }
    }

    // Factory method detection using utilities
    if (TransformerUtils.isFactoryMethod(expr, "U256Factory")) {
      return true;
    }

    // Static U256 method calls
    if (TransformerUtils.isStaticTypeMethod(target, "U256", "copy")) {
      return true;
    }

    // Return type validation using utilities
    if (TransformerUtils.isValidReturnType(expr, AbiType.Uint256)) {
      return true;
    }

    // Handle dotted method calls and receiver-based calls
    if (target.includes(".") || expr.receiver) {
      // Use centralized exclusion logic
      if (TypeExclusionHelper.shouldExcludeTarget(target)) {
        return false;
      }

      const methodName = expr.receiver ? target : MethodDetectionHelper.extractMethodName(target);

      const u256Methods = [
        ...METHOD_GROUPS.ARITHMETIC,
        ...METHOD_GROUPS.COMPARISON,
        MethodName.ToString,
        "copy",
      ];

      if (u256Methods.includes(methodName as MethodName)) {
        if (expr.receiver) {
          const hasU256Receiver = expr.receiver.type === AbiType.Uint256;
          const hasU256Return =
            (expr.returnType as AbiType) === AbiType.Uint256 ||
            (expr.returnType as AbiType) === AbiType.Bool;
          
          return hasU256Receiver || hasU256Return;
        }

        return (
          (expr.returnType as AbiType) === AbiType.Uint256 ||
          (expr.returnType as AbiType) === AbiType.Bool
        );
      }
    }

    return false;
  }

  /**
   * Fallback handler for expressions that don't match any specialized handler.
   *
   * This method is called when `canHandle()` returns `true` but no registered
   * handler can process the expression. It generates an error comment in the
   * output code to help with debugging.
   *
   * @param callExpression - The unhandled call expression
   * @returns EmitResult containing an error comment and default type information
   *
   * @internal This method should rarely be called in a well-configured transformer
   */
  protected handleDefault(callExpression: Call): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported U256 expression: ${JSON.stringify(callExpression) || ""} */`,
      valueType: "U256",
    };
  }
}
