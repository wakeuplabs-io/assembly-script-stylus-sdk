import { CallExpression, Expression, PropertyAccessExpression, SyntaxKind } from "ts-morph";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression } from "@/cli/types/ir.types.js";
import { getMethodReturnType, isValidMethodName } from "@/cli/types/method-types.js";
import {
  isSupportedReceiverKind,
  getReceiverInfo,
  ReceiverType,
} from "@/cli/types/receiver-types.js";

import { IRBuilder } from "../shared/ir-builder.js";
import { IRUtils } from "../shared/ir-utils.js";
import { SupportedType } from "../shared/supported-types.js";

/**
 * Centralized analyzer for chained call expressions.
 * Handles all types of method chaining with proper receiver structure.
 *
 * Examples handled:
 * - U256Factory.fromString("2").add(counter)
 * - result.mul(three).div(divisor)
 * - owners.get(tokenId).isZero()
 * - user.address.toString()
 */
export class ChainedCallAnalyzer extends IRBuilder<IRExpression> {
  private call: CallExpression;

  constructor(call: CallExpression) {
    super(call);
    this.call = call;
  }

  validate(): boolean {
    try {
      // Enhanced validation
      if (!this.isChainedCall(this.call)) {
        return false;
      }

      // Validate receiver structure
      const target = this.call.getExpression();
      if (target.getKind() !== SyntaxKind.PropertyAccessExpression) {
        return false;
      }

      const propAccess = target as PropertyAccessExpression;
      const receiverExpr = propAccess.getExpression();

      // Ensure receiver is valid for chaining
      return (
        isSupportedReceiverKind(receiverExpr.getKind()) && IRUtils.isValidForChaining(receiverExpr)
      );
    } catch {
      return false;
    }
  }

  /**
   * Detects if a CallExpression should use chained call structure
   *
   * Enhanced detection using structured receiver types
   */
  static isChainedCall(expr: CallExpression): boolean {
    const target = expr.getExpression();

    if (target.getKind() !== SyntaxKind.PropertyAccessExpression) {
      return false;
    }

    const propAccess = target as PropertyAccessExpression;
    const receiverKind = propAccess.getExpression().getKind();

    // Use structured receiver type detection - only chainable receivers
    const receiverInfo = getReceiverInfo(receiverKind);
    return receiverInfo?.isChainable ?? false;
  }

  /**
   * Public static method for external use
   */
  isChainedCall(expr: CallExpression): boolean {
    return ChainedCallAnalyzer.isChainedCall(expr);
  }

  buildIR(): IRExpression {
    const target = this.call.getExpression() as PropertyAccessExpression;
    const methodName = target.getName();
    const receiverExpr = target.getExpression();

    // Build receiver IR using enhanced method
    const receiver = this.buildReceiverIR(receiverExpr);

    // Build arguments IR using utility
    const args = IRUtils.buildExpressionListIR(this.call.getArguments() as Expression[]);

    // Determine return type using enhanced methods
    const receiverReturnType = IRUtils.extractReturnType(receiver);
    const returnType = this.inferReturnType(receiverReturnType, methodName);

    // Use utility to create standardized call IR
    return IRUtils.createCallIR(methodName, receiver, args, returnType);
  }

  /**
   * Builds IR for the receiver expression using structured approach
   */
  private buildReceiverIR(receiverExpr: Expression): IRExpression {
    const receiverKind = receiverExpr.getKind();
    const receiverInfo = getReceiverInfo(receiverKind);

    if (!receiverInfo) {
      // Fallback for unsupported receiver types
      return IRUtils.buildExpressionIR(receiverExpr);
    }

    return this.buildReceiverByType(receiverExpr, receiverInfo.type);
  }

  /**
   * Type-specific receiver building for better organization
   */
  private buildReceiverByType(receiverExpr: Expression, type: ReceiverType): IRExpression {
    switch (type) {
      case ReceiverType.CALL: {
        const receiverCall = receiverExpr as CallExpression;

        // Check if this call is also chainable
        if (ChainedCallAnalyzer.isChainedCall(receiverCall)) {
          const chainedAnalyzer = new ChainedCallAnalyzer(receiverCall);
          return chainedAnalyzer.buildIR();
        }

        return IRUtils.buildExpressionIR(receiverCall);
      }

      case ReceiverType.PROPERTY: {
        // Property access receivers should be handled by general expression builder
        // This typically represents nested property chains
        return IRUtils.buildExpressionIR(receiverExpr);
      }

      case ReceiverType.IDENTIFIER:
      default: {
        // Identifier or other expression types
        return IRUtils.buildExpressionIR(receiverExpr);
      }
    }
  }

  // Removed getReturnType - now using IRUtils.extractReturnType

  /**
   * Enhanced return type inference using structured types with error handling
   */
  private inferReturnType(receiverType: SupportedType, methodName: string): SupportedType {
    try {
      // Primary inference using structured type mapping
      if (isValidMethodName(methodName)) {
        const inferredType = getMethodReturnType(receiverType, methodName);

        if (inferredType !== AbiType.Unknown) {
          return inferredType;
        }
      }

      // Fallback inference for edge cases
      return this.inferReturnTypeFallback(receiverType, methodName);
    } catch (error) {
      // Safety net - return receiver type if all else fails
      console.warn(`Type inference failed for ${receiverType}.${methodName}:`, error);
      return IRUtils.safeTypeExtraction({ type: receiverType } as IRExpression, receiverType);
    }
  }

  /**
   * Fallback inference for method names not in our structured types
   */
  private inferReturnTypeFallback(receiverType: SupportedType, methodName: string): SupportedType {
    // Handle special cases not covered by structured types
    if (receiverType === AbiType.Function) {
      // For factory methods that include certain patterns
      if (methodName.includes("fromString") || methodName.includes("from")) {
        return AbiType.Uint256; // Most factory "from" methods create U256
      }
      if (methodName.includes("create") || methodName.includes("new")) {
        return AbiType.Uint256; // Most factory creation methods return U256
      }
    }

    // For mapping methods, we might need specialized handling
    if (receiverType === AbiType.Mapping) {
      if (methodName === "get") {
        // TODO: Should get actual value type from mapping metadata
        return AbiType.Address; // Default assumption for now
      }
      if (methodName === "set" || methodName === "put") {
        return AbiType.Void;
      }
    }

    // Default: return the receiver type (method returns same type as receiver)
    return receiverType;
  }
}
