import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";

import { BaseTypeTransformer } from "../core/base-transformer.js";
import { MethodDetectionHelper } from "../core/method-detection-helper.js";
import { TransformerUtils } from "../core/transformer-utils.js";
import { TypeExclusionHelper } from "../core/type-exclusion-helper.js";
import { I256AbsHandler } from "./handlers/abs-handler.js";
import { I256ComparisonHandler } from "./handlers/comparison-handler.js";
import { I256CreateHandler } from "./handlers/create-handler.js";
import { I256FromStringHandler } from "./handlers/from-string-handler.js";
import { I256FromU256Handler } from "./handlers/from-u256-handler.js";
import { I256FunctionCallHandler } from "./handlers/function-call-handler.js";
import { I256NegateHandler } from "./handlers/negate-handler.js";
import { I256OperationHandler } from "./handlers/operation-handler.js";
import { I256PropertyHandler } from "./handlers/property-handler.js";
import { I256ToStringHandler } from "./handlers/to-string-handler.js";
import { ContractContext } from "../core/contract-context.js";

/** Transforms I256 expressions from TypeScript to AssemblyScript with signed integer operations and type conversions */
export class I256Transformer extends BaseTypeTransformer {
  constructor(contractContext: ContractContext) {
    super(contractContext, "I256");

    this.registerHandler(new I256CreateHandler(contractContext));
    this.registerHandler(new I256FromStringHandler(contractContext));
    this.registerHandler(new I256FromU256Handler(contractContext));
    this.registerHandler(new I256OperationHandler(contractContext));
    this.registerHandler(new I256ComparisonHandler(contractContext));
    this.registerHandler(new I256PropertyHandler(contractContext));
    this.registerHandler(new I256NegateHandler(contractContext));
    this.registerHandler(new I256ToStringHandler(contractContext));
    this.registerHandler(new I256AbsHandler(contractContext));
    this.registerHandler(new I256FunctionCallHandler(contractContext));
  }

  canHandle(expr: IRExpression): boolean {
    if (expr.kind !== "call") return false;
    const target = expr.target || "";

    // Early exclusion checks using centralized utilities
    if (TypeExclusionHelper.shouldExcludeExpression(expr)) {
      return false;
    }

    // Factory method detection using utilities (including I256-specific fromU256)
    if (TransformerUtils.isFactoryMethod(expr, "I256Factory")) {
      return true;
    }

    // Handle I256Factory.fromU256 specifically
    if (
      target === "I256Factory.fromU256" ||
      (target === "fromU256" &&
        expr.receiver?.kind === "var" &&
        expr.receiver?.name === "I256Factory")
    ) {
      return true;
    }

    // Static I256 method calls
    if (TransformerUtils.isStaticTypeMethod(target, "I256", "copy")) {
      return true;
    }

    // Return type validation using utilities
    if (TransformerUtils.isValidReturnType(expr, AbiType.Int256)) {
      return true;
    }

    // I256-specific boolean operations
    if (expr.returnType === AbiType.Bool) {
      // I256-specific: isNegative property
      if (MethodDetectionHelper.isSpecificMethod(target, "isNegative")) {
        return true;
      }

      // Exclude Address operations using centralized helper
      if (TypeExclusionHelper.isAddressOperation(target)) {
        return false;
      }

      // Comparison methods using helper
      if (MethodDetectionHelper.isComparisonMethod(target)) {
        return true;
      }
    }

    // I256-specific toString operations
    if (expr.returnType === AbiType.String) {
      if (MethodDetectionHelper.isTypeSpecificToString(target, "I256")) {
        return true;
      }
    }

    return false;
  }

  protected handleDefault(expr: IRExpression): EmitResult {
    return {
      setupLines: [],
      valueExpr: `/* Error: Unsupported I256 expression: ${expr.kind} */`,
      valueType: "I256",
    };
  }
}
