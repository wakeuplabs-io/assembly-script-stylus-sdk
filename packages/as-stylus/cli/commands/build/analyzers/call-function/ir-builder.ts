import { CallExpression, Expression, PropertyAccessExpression, SyntaxKind } from "ts-morph";

import { ctx } from "@/cli/shared/compilation-context.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { IRExpression, IRMapGet, IRMapGet2, IRMapSet, IRMapSet2 } from "@/cli/types/ir.types.js";
import { FunctionSymbol, VariableSymbol } from "@/cli/types/symbol-table.types.js";

import { buildAddressIR } from "./address.js";
import { buildI256IR } from "./i256.js";
import { buildStringIR } from "./string.js";
import { buildU256IR } from "./u256.js";
import { ExpressionIRBuilder } from "../expression/ir-builder.js";
import { IRBuilder } from "../shared/ir-builder.js";
import { SupportedType } from "../shared/supported-types.js";
import { StructFactoryBuilder } from "../struct/struct-factory-builder.js";

export class CallFunctionIRBuilder extends IRBuilder<IRExpression> {
  private call: CallExpression;

  constructor(expr: CallExpression) {
    super(expr);
    this.call = expr;
  }

  validate(): boolean {
    return true;
  }

  private getReturnType(target: string): SupportedType {
    const symbol = this.symbolTable.lookup(target);
    if (symbol && symbol.type === "function") {
      return (symbol as FunctionSymbol).returnType;
    }

    const variable = target.split(".")[0];
    const variableDeclared = this.symbolTable.lookup(variable);
    if (variableDeclared && variableDeclared.type !== "function") {
      return (variableDeclared as VariableSymbol).type;
    }

    return AbiType.Unknown;
  }

  buildIR(): IRExpression {
    const expr = this.call.getExpression();
    console.log(`>>> CallFunctionIRBuilder.buildIR() - Full call: ${this.call.getText()}`);
    console.log(`>>> CallFunctionIRBuilder.buildIR() - expr: ${expr.getText()}`);

    if (StructFactoryBuilder.isStructFactoryCreate(this.call)) {
      return StructFactoryBuilder.buildStructCreateIR(this.call);
    }

    // ChainedCallAnalyzer now handles all chained expressions at ExpressionIRBuilder level
    // This fallback should only handle non-chained calls
    // if (this.isChainedExpression(expr)) {
    //   return this.buildSimpleChainedCall();  
    // }

    // Try to detect Mapping access: Balances.balances.get(user) or .set(user, value)
    if (expr.getKindName() === "PropertyAccessExpression") {
      const methodAccess = expr as PropertyAccessExpression;
      const methodName = methodAccess.getName();
      const mappingExpr = methodAccess.getExpression();

      if (mappingExpr.getKindName() === "Identifier") {
        const mappingName = mappingExpr.getText();

        const slot = this.lookupSlot(mappingName);
        const args = this.call.getArguments().map((arg) => {
          const builder = new ExpressionIRBuilder(arg as Expression);
          return builder.validateAndBuildIR();
        });

        if (slot !== undefined) {
          // Get mapping type information from context
          const mappingTypeInfo = ctx.mappingTypes.get(mappingName);

          if (methodName === "get" && args.length === 1) {
            // Convert valueType to AbiType for returnType
            const valueType = mappingTypeInfo?.valueType || "U256";
            let returnType: SupportedType;
            switch (valueType) {
              case "Address":
                returnType = AbiType.Address;
                break;
              case "U256":
                returnType = AbiType.Uint256;
                break;
              case "I256":
                returnType = AbiType.Int256;
                break;
              case "boolean":
                returnType = AbiType.Bool;
                break;
              default:
                returnType = AbiType.Unknown;
            }
            return {
              kind: "map_get",
              slot,
              key: args[0],
              keyType: mappingTypeInfo?.keyType || "Address",
              valueType,
              type: AbiType.Mapping,
              returnType,
            } as IRMapGet;
          } else if (methodName === "set" && args.length === 2) {
            return {
              kind: "map_set",
              slot,
              key: args[0],
              value: args[1],
              keyType: mappingTypeInfo?.keyType || "Address",
              valueType: mappingTypeInfo?.valueType || "U256",
            } as IRMapSet;
          } else if (methodName === "get" && args.length === 2) {
            // Convert valueType to AbiType for returnType
            const valueType = mappingTypeInfo?.valueType || "U256";
            let returnType: SupportedType;
            switch (valueType) {
              case "Address":
                returnType = AbiType.Address;
                break;
              case "U256":
                returnType = AbiType.Uint256;
                break;
              case "I256":
                returnType = AbiType.Int256;
                break;
              case "boolean":
                returnType = AbiType.Bool;
                break;
              default:
                returnType = AbiType.Unknown;
            }
            return {
              kind: "map_get2",
              slot,
              key1: args[0],
              key2: args[1],
              keyType1: mappingTypeInfo?.keyType1 || "Address",
              keyType2: mappingTypeInfo?.keyType2 || "Address",
              valueType,
              type: AbiType.MappingNested,
              returnType,
            } as IRMapGet2;
          } else if (methodName === "set" && args.length === 3) {
            return {
              kind: "map_set2",
              slot,
              key1: args[0],
              key2: args[1],
              value: args[2],
              keyType1: mappingTypeInfo?.keyType1 || "Address",
              keyType2: mappingTypeInfo?.keyType2 || "Address",
              valueType: mappingTypeInfo?.valueType || "U256",
            } as IRMapSet2;
          }
        }
      }
    }
    const target = expr.getText();
    console.log(`>>> FALLBACK target generation: "${target}"`);
    
    const args = this.call.getArguments().map((argument) => {
      const expressionBuilder = new ExpressionIRBuilder(argument as Expression);
      return expressionBuilder.validateAndBuildIR();
    });

    const [varName] = target.split(".");
    const variable = this.symbolTable.lookup(varName);
    const scope = variable?.scope ?? "memory";

    if (variable?.type === AbiType.Uint256) {
      return buildU256IR(target, this.call, this.symbolTable);
    }

    if (variable?.type === AbiType.Int256) {
      return buildI256IR(target, this.call, this.symbolTable);
    }

    if (variable?.type === AbiType.String) {
      return buildStringIR(target, this.call, this.symbolTable);
    }

    if (variable?.type === AbiType.Address) {
      return buildAddressIR(target, this.call, this.symbolTable);
    }

    const isUserDefinedFunction = (this.symbolTable.lookup(target) as FunctionSymbol)
      ?.isDeclaredByUser;
    const type = isUserDefinedFunction ? AbiType.UserDefinedFunction : AbiType.Function;

    return { kind: "call", target, args, type, returnType: this.getReturnType(target), scope };
  }

  private lookupSlot(fqName: string): number | undefined {
    return ctx.slotMap.get(fqName);
  }

  /**
   * Detects if an expression is a chained call that needs special IR structure
   */
  private isChainedExpression(expr: Expression): boolean {
    console.log(`>>> DEBUG isChainedExpression: ${expr.getText()}`);
    console.log(`>>> expr kind: ${expr.getKindName()}`);
    
    // Check if this is a PropertyAccessExpression (method call on an object)
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr as PropertyAccessExpression;
      const leftSide = propAccess.getExpression();
      
      console.log(`>>> leftSide kind: ${leftSide.getKindName()}`);
      console.log(`>>> leftSide text: ${leftSide.getText()}`);
      
      // Check if the left side is itself a call expression (chained calls)
      if (leftSide.getKind() === SyntaxKind.CallExpression) {
        console.log(`>>> DETECTED CHAINED CALL: ${expr.getText()}`);
        return true;
      }
    }
    
    console.log(`>>> NOT a chained call: ${expr.getText()}`);
    return false;
  }

  /**
   * Builds IR for chained expressions with proper receiver structure
   * Handles recursive chaining like owners.get(tokenId).isZero()
   */
  private buildSimpleChainedCall(): IRExpression {
    console.log(`>>> EXECUTING buildSimpleChainedCall for: ${this.call.getText()}`);
    const callTarget = this.call.getExpression();
    
    if (callTarget.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = callTarget as PropertyAccessExpression;
      const methodName = propAccess.getName();
      const receiverExpr = propAccess.getExpression();
      
      console.log(`>>> Method: ${methodName}, Receiver: ${receiverExpr.getText()}`);
      
      // Build IR for the receiver recursively
      let receiver: IRExpression;
      
      // Build receiver with proper IR structure
      if (receiverExpr.getKind() === SyntaxKind.CallExpression) {
        console.log(`>>> Receiver is CallExpression, building recursively`);
        const receiverBuilder = new CallFunctionIRBuilder(receiverExpr as CallExpression);
        receiver = receiverBuilder.validateAndBuildIR();
      } else if (receiverExpr.getKind() === SyntaxKind.PropertyAccessExpression) {
        console.log(`>>> Receiver is PropertyAccessExpression, checking for method calls`);
        // This handles cases like result.mul() in result.mul(three).div(divisor)
        const propAccess = receiverExpr as PropertyAccessExpression;
        const baseExpr = propAccess.getExpression();
        const methodName = propAccess.getName();
        
        // Build IR for the base expression (e.g., 'result')
        const baseBuilder = new ExpressionIRBuilder(baseExpr);
        const baseReceiver = baseBuilder.validateAndBuildIR();
        
        // Create a proper call IR for the method (e.g., result.mul())
        receiver = {
          kind: "call",
          target: methodName,
          receiver: baseReceiver,
          args: [], // PropertyAccessExpression has no args, actual args come from full call
          type: AbiType.Function,
          returnType: this.getChainedReturnType('returnType' in baseReceiver ? baseReceiver.returnType : AbiType.Unknown, methodName),
          scope: "memory",
        };
        
        console.log(`>>> Created method call receiver: ${methodName} on ${baseExpr.getText()}`);
      } else {
        console.log(`>>> Receiver is ${receiverExpr.getKindName()}, building normally`);
        const receiverBuilder = new ExpressionIRBuilder(receiverExpr);
        receiver = receiverBuilder.validateAndBuildIR();
      }
      
      // Build IR for the arguments
      const args = this.call.getArguments().map((argument) => {
        const expressionBuilder = new ExpressionIRBuilder(argument as Expression);
        return expressionBuilder.validateAndBuildIR();
      });
      
      // Determine return type based on receiver and method
      const receiverReturnType = 'returnType' in receiver ? receiver.returnType : AbiType.Unknown;
      const returnType = this.getChainedReturnType(receiverReturnType, methodName);
      
      console.log(`>>> Generated IR with receiver structure - method: ${methodName}, returnType: ${returnType}`);
      
      return {
        kind: "call",
        target: methodName,
        receiver: receiver,
        args,
        type: AbiType.Function,
        returnType,
        scope: "memory",
      };
    }
    
    // Fallback to regular call handling
    console.log(`>>> Fallback: not PropertyAccessExpression`);
    const args = this.call.getArguments().map((argument) => {
      const expressionBuilder = new ExpressionIRBuilder(argument as Expression);
      return expressionBuilder.validateAndBuildIR();
    });
    
    return {
      kind: "call",
      target: callTarget.getText(),
      args,
      type: AbiType.Function,
      returnType: AbiType.Unknown,
      scope: "memory",
    };
  }

  /**
   * Extracts the method name from a chained call
   * Example: "U256Factory.fromString(\"2\").add" + "U256Factory.fromString(\"2\")" -> "add"
   */
  private extractMethodNameFromChainedCall(fullTarget: string, baseTarget: string): string {
    // Remove the base part and the dot to get the method name
    if (fullTarget.startsWith(baseTarget) && fullTarget.length > baseTarget.length) {
      return fullTarget.substring(baseTarget.length + 1); // +1 for the dot
    }

    // Fallback: try to extract method name from the end
    const parts = fullTarget.split(".");
    return parts[parts.length - 1] || "unknown";
  }

  /**
   * Determines the return type for a chained method call
   */
  private getChainedReturnType(baseReturnType: SupportedType, methodName: string): SupportedType {
    console.log(`>>> getChainedReturnType: baseType=${baseReturnType}, method=${methodName}`);
    
    // For U256 methods, most return U256 except comparisons
    if (baseReturnType === AbiType.Uint256) {
      const comparisonMethods = [
        "lessThan",
        "greaterThan", 
        "equals",
        "lessThanOrEqual",
        "greaterThanOrEqual",
        "notEqual",
      ];
      if (comparisonMethods.includes(methodName)) {
        return AbiType.Bool;
      }
      return AbiType.Uint256;
    }

    // For I256 methods, similar logic
    if (baseReturnType === AbiType.Int256) {
      const comparisonMethods = [
        "lessThan",
        "greaterThan",
        "equals", 
        "lessThanOrEqual",
        "greaterThanOrEqual",
        "notEqual",
      ];
      if (comparisonMethods.includes(methodName)) {
        return AbiType.Bool;
      }
      return AbiType.Int256;
    }

    // For Address methods
    if (baseReturnType === AbiType.Address) {
      if (methodName === "isZero") {
        return AbiType.Bool;
      }
      if (methodName === "toString") {
        return AbiType.String;
      }
      return AbiType.Address;
    }

    // For Mapping methods
    if (baseReturnType === AbiType.Mapping) {
      // Mapping.get() can return various types - need to infer from context
      if (methodName === "get") {
        // For now, assume Address since that's what owners mapping returns
        // TODO: Should get this from mapping type information
        return AbiType.Address;
      }
      return baseReturnType;
    }

    // For String methods
    if (baseReturnType === AbiType.String) {
      if (methodName === "length") {
        return AbiType.Uint256;
      }
      if (methodName === "slice") {
        return AbiType.String;
      }
      return AbiType.String;
    }

    console.log(`>>> getChainedReturnType: defaulting to baseReturnType for ${methodName}`);
    // For other types, assume same type
    return baseReturnType;
  }
}
