import { InterfaceAnalyzer } from "@/cli/commands/build/analyzers/interface-analyzer.js";
import { Handler } from "@/cli/commands/build/transformers/core/base-abstract-handlers.js";
import { AbiType } from "@/cli/types/abi.types.js";
import { EmitResult } from "@/cli/types/emit.types.js";
import { IRExpression, Call } from "@/cli/types/ir.types.js";
import { ContractContext } from "@/transformers/core/contract-context.js";

/** Handles function call expressions with proper argument transformation and return type handling */
export class CallTransformer extends Handler {
  private static callCounter: number = 0;
  private static interfaceAnalyzer: InterfaceAnalyzer | null = null;

  constructor(contractContext: ContractContext) {
    super(contractContext);
    this.initializeInterfaceAnalyzer();
  }

  /** Initialize the interface analyzer once for all instances */
  private initializeInterfaceAnalyzer(): void {
    if (!CallTransformer.interfaceAnalyzer) {
      CallTransformer.interfaceAnalyzer = InterfaceAnalyzer.getInstance();
      CallTransformer.interfaceAnalyzer.initialize();
    }
  }

  canHandle(expr: IRExpression): boolean {
    return expr.kind === "call";
  }

  handle(call: Call): EmitResult {
    if (call.target === "super") {
      const argResults = this.transformArguments(call.args);
      const allSetupLines = this.combineSetupLines(argResults);

      return {
        setupLines: allSetupLines,
        valueExpr: `${this.contractContext.getParentName()}_constructor(${argResults.map((r) => r.valueExpr).join(", ")})`,
      };
    }

    if (call.target === "Address.equals" && !call.receiver) {
      return this.handleAddressEqualsCall(call);
    }

    if (this.isU256Operation(call)) {
      return this.handleU256Operation(call);
    }

    if (this.isStrToABICall(call)) {
      return this.handleStrToABICall(call);
    }

    if (this.isInterfaceMethodCall(call)) {
      return this.handleInterfaceMethodCall(call);
    }

    if (this.isDottedInterfaceMethodCall(call)) {
      return this.handleDottedInterfaceMethodCall(call);
    }

    if ("receiver" in call && call.receiver) {
      // Let type-specific transformers handle type-specific chained calls
      // Only handle generic chained calls that don't belong to specific types
      if (!this.shouldDeferToTypeSpecificTransformer(call)) {
        return this.handleChainedCall(call);
      }
    }

    // Handle regular calls without receiver
    const argResults = this.transformArguments(call.args);
    const allSetupLines = this.combineSetupLines(argResults);
    const argValues = argResults.map((r) => r.valueExpr).join(", ");

    const baseCall = `${call.target}(${argValues})`;
    const isStruct = call.args.length > 0 && call.args[0].type === AbiType.Struct;
    if (isStruct) {
      return {
        setupLines: allSetupLines,
        valueExpr: baseCall,
      };
    }

    if (call.returnType === AbiType.Bool) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Boolean.fromABI(${baseCall})`,
      };
    }

    if (call.returnType === AbiType.String) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Str.fromABI(${baseCall})`,
      };
    }

    if (call.type === AbiType.UserDefinedFunction) {
      return {
        setupLines: allSetupLines,
        valueExpr: baseCall,
      };
    }

    // Fallback: return the base call without re-delegating to avoid infinite loops
    return {
      setupLines: allSetupLines,
      valueExpr: baseCall,
    };
  }

  /**
   * Handles chained calls with receiver field
   */
  private handleChainedCall(call: Call): EmitResult {
    // Ensure receiver exists (should always be true when this method is called)
    if (!call.receiver) {
      throw new Error("handleChainedCall called on call without receiver");
    }

    // Transform the receiver first
    const receiverResult = this.contractContext.emitExpression(call.receiver);

    // Transform the arguments
    const argResults = this.transformArguments(call.args);

    // Combine all setup lines
    const allSetupLines = [...receiverResult.setupLines, ...this.combineSetupLines(argResults)];

    const argValues = argResults.map((r) => r.valueExpr).join(", ");
    const chainedCall = argValues
      ? `${receiverResult.valueExpr}.${call.target}(${argValues})`
      : `${receiverResult.valueExpr}.${call.target}()`;

    // Handle return type conversions for chained calls
    if (call.returnType === AbiType.Bool) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Boolean.fromABI(${chainedCall})`,
      };
    }

    if (call.returnType === AbiType.String) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Str.fromABI(${chainedCall})`,
      };
    }

    return {
      setupLines: allSetupLines,
      valueExpr: chainedCall,
    };
  }

  private transformArguments(args: IRExpression[]): EmitResult[] {
    return args.map((arg) => this.contractContext.emitExpression(arg));
  }

  private combineSetupLines(argResults: EmitResult[]): string[] {
    return argResults.reduce((acc: string[], result: EmitResult) => {
      return acc.concat(result.setupLines);
    }, []);
  }

  /**
   * Determines if a chained call should be handled by a type-specific transformer
   */
  private shouldDeferToTypeSpecificTransformer(call: Call): boolean {
    const target = call.target || "";

    // Check if this is a type-specific method
    const typeSpecificMethods = [
      // U256/I256 methods
      "add",
      "sub",
      "mul",
      "div",
      "mod",
      "pow",
      "lessThan",
      "greaterThan",
      "equals",
      "notEqual",
      "lessThanOrEqual",
      "greaterThanOrEqual",
      "toString",
      "copy",

      // Address methods
      "isZero",
      "hasCode",

      // String methods
      "length",
      "slice",

      // Factory methods
      "create",
      "fromString",
      "fromU256",
    ];

    if (typeSpecificMethods.includes(target)) {
      // Check if receiver has a type that would be handled by specific transformers
      if (call.receiver) {
        const receiverType = call.receiver.type;
        const receiverReturnType = call.receiver.kind === "call" ? call.receiver.returnType : null;

        // If receiver is or returns a specific type, defer to specific transformer
        return (
          receiverType === AbiType.Uint256 ||
          receiverType === AbiType.Int256 ||
          receiverType === AbiType.Address ||
          receiverType === AbiType.String ||
          receiverReturnType === AbiType.Uint256 ||
          receiverReturnType === AbiType.Int256 ||
          receiverReturnType === AbiType.Address ||
          receiverReturnType === AbiType.String ||
          // Factory calls should also be deferred
          (call.receiver.kind === "var" &&
            ["U256Factory", "I256Factory", "AddressFactory", "StrFactory"].includes(
              call.receiver.name || "",
            ))
        );
      }
    }

    return false;
  }

  /**
   * Check if this is a dotted interface method call (e.g., "token.balanceOf")
   */
  private isDottedInterfaceMethodCall(call: Call): boolean {
    if (!call.target || !call.target.includes(".")) {
      return false;
    }

    // Handle compound interface cast calls like: (InterfaceCastingContract.tokenAddress as IERC20).totalSupply
    if (call.target.includes(" as ") && call.target.includes(").")) {
      return true;
    }

    const parts = call.target.split(".");
    if (parts.length !== 2) {
      return false;
    }

    const [receiverName, methodName] = parts;

    // Use dynamic interface analyzer if available, otherwise fallback to hardcoded list
    let isKnownInterfaceMethod = false;
    if (CallTransformer.interfaceAnalyzer) {
      isKnownInterfaceMethod = CallTransformer.interfaceAnalyzer.isInterfaceMethod(methodName);
    }

    // If dynamic analyzer didn't find it, fall back to hardcoded list
    if (!isKnownInterfaceMethod) {
      const interfaceMethods = [
        "balanceOf",
        "transfer",
        "totalSupply",
        "name",
        "symbol",
        "decimals",
        "ownerOf",
        "transferFrom",
        "approve",
        "getApproved",
        "getPrice",
        "updatePrice",
        "isValidPriceData",
      ];
      isKnownInterfaceMethod = interfaceMethods.includes(methodName);
    }

    return (
      isKnownInterfaceMethod &&
      (receiverName.includes("token") ||
        receiverName.includes("nft") ||
        receiverName.includes("oracle") ||
        receiverName.startsWith("interfaceCast_"))
    );
  }

  /**
   * Handle dotted interface method calls by parsing the target
   */
  private handleDottedInterfaceMethodCall(call: Call): EmitResult {
    if (!call.target || !call.target.includes(".")) {
      return {
        setupLines: [],
        valueExpr: `U256.create()`,
        valueType: "U256",
      };
    }

    let receiverName: string;
    let methodName: string;

    // Handle compound interface cast calls like: (InterfaceCastingContract.tokenAddress as IERC20).totalSupply
    if (call.target.includes(" as ") && call.target.includes(").")) {
      // Parse: (memberAccess as InterfaceName).methodName
      const match = call.target.match(/^\((.+) as ([^)]+)\)\.(.+)$/);
      if (match) {
        const [, memberAccess, interfaceName, targetMethod] = match;
        methodName = targetMethod;

        // Create interface cast for the member access
        const callId = (++CallTransformer.callCounter).toString();
        receiverName = `interfaceCast_${callId}`;

        // Transform member access to load function
        let loadExpr = memberAccess;
        if (memberAccess.includes("Contract.")) {
          const propertyName = memberAccess.split(".").pop();
          loadExpr = `load_${propertyName}()`;
        }

        // Add interface cast setup
        const setupLines: string[] = [];
        setupLines.push(
          `const ${receiverName} = InterfaceCast.create(${loadExpr}, "${interfaceName}");`,
        );

        return this.generateInterfaceCall(receiverName, methodName, call.args, setupLines);
      }
    }

    // Handle simple dotted calls: receiverName.methodName
    const parts = call.target.split(".");
    [receiverName, methodName] = parts;

    return this.generateInterfaceCall(receiverName, methodName, call.args);
  }

  /**
   * Generate interface call setup lines and return expression
   */
  private generateInterfaceCall(
    receiverName: string,
    methodName: string,
    args: any[] = [],
    initialSetupLines: string[] = [],
  ): EmitResult {
    const argResults = this.transformArguments(args);

    const setupLines: string[] = [...initialSetupLines, ...this.combineSetupLines(argResults)];
    const callId = (++CallTransformer.callCounter).toString();

    const methodSignature = this.getMethodSignature(methodName);
    const selector = this.getMethodSelector(methodSignature);
    const argExprs = argResults.map((r) => r.valueExpr);

    if (selector !== 0) {
      setupLines.push(
        `const calldata_${callId} = ABI.encodeCallWithSelector(0x${selector.toString(16).padStart(8, "0")}, [${argExprs.join(", ")}]);`,
      );
    } else {
      setupLines.push(`const methodSig_${callId} = "${methodSignature}";`);
      setupLines.push(
        `const calldata_${callId} = ABI.encodeCall(methodSig_${callId}, [${argExprs.join(", ")}]);`,
      );
    }
    setupLines.push(
      `const callResult_${callId} = Calls.staticCall(InterfaceCast.getAddress(${receiverName}), ABI.getPtr(calldata_${callId}), ABI.getLen(calldata_${callId}));`,
    );
    const functionReturnType = this.contractContext.currentFunctionReturnType || "unknown";

    setupLines.push(`if (!CallResult.isSuccess(callResult_${callId})) {`);

    if (functionReturnType === "void") {
      setupLines.push(`  return;`);
    } else {
      setupLines.push(`  return ${this.getDefaultReturnValue(functionReturnType)};`);
    }
    setupLines.push(`}`);

    if (functionReturnType === "void") {
      return {
        setupLines,
        valueExpr: "",
        valueType: "void",
      };
    }

    const returnType = this.getMethodReturnType(methodName);
    const decodedPtr = `ABI.decodeReturn(CallResult.getReturnData(callResult_${callId}), "${returnType}")`;
    const valueExpr = decodedPtr;

    return {
      setupLines,
      valueExpr,
      valueType: this.mapAbiTypeToTransformerType(returnType),
    };
  }

  /**
   * Check if this is an interface method call on interface cast object
   */
  private isInterfaceMethodCall(call: Call): boolean {
    if (!call.receiver) return false;

    // Use dynamic interface analyzer if available
    let isKnownInterfaceMethod = false;
    if (CallTransformer.interfaceAnalyzer) {
      isKnownInterfaceMethod = CallTransformer.interfaceAnalyzer.isInterfaceMethod(
        call.target || "",
      );
    }

    // If dynamic analyzer didn't find it, fall back to hardcoded list
    if (!isKnownInterfaceMethod) {
      const interfaceMethods = [
        "balanceOf",
        "transfer",
        "totalSupply",
        "name",
        "symbol",
        "decimals",
        "ownerOf",
        "transferFrom",
        "approve",
        "getApproved",
        "getPrice",
        "updatePrice",
        "isValidPriceData",
      ];
      isKnownInterfaceMethod = interfaceMethods.includes(call.target || "");
    }

    if (!isKnownInterfaceMethod) {
      return false;
    }

    // Check if receiver is an interface cast variable (by name pattern)
    if (call.receiver.kind === "var" && "name" in call.receiver) {
      const receiverName = (call.receiver as any).name;

      // Direct interface cast variables
      if (receiverName && receiverName.startsWith("interfaceCast_")) {
        return true;
      }

      // Variables assigned from interface casts (token, nft, oracle, etc.)
      // These are common variable names used in interface casting
      if (
        receiverName &&
        (receiverName === "token" ||
          receiverName === "nft" ||
          receiverName === "oracle" ||
          receiverName.includes("token") ||
          receiverName.includes("nft") ||
          receiverName.includes("oracle"))
      ) {
        return true;
      }
    }

    // Check if receiver has interface type from valueType
    if ("valueType" in call.receiver) {
      const valueType = (call.receiver as any).valueType;
      const interfaceNames = ["IERC20", "IERC721", "IOracle"];
      if (valueType && interfaceNames.includes(valueType)) {
        return true;
      }
    }

    // Check if receiver's type indicates interface cast
    if ("type" in call.receiver && call.receiver.type === "address") {
      // Additional check: if receiver name suggests it's from an interface cast
      if (call.receiver.kind === "var" && "name" in call.receiver) {
        const receiverName = (call.receiver as any).name;
        if (
          receiverName &&
          (receiverName.includes("token") ||
            receiverName.includes("nft") ||
            receiverName.includes("oracle"))
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handle interface method calls with actual external call implementation
   */
  private handleInterfaceMethodCall(call: Call): EmitResult {
    if (!call.receiver) {
      return {
        setupLines: [],
        valueExpr: `U256.create()`,
        valueType: "U256",
      };
    }

    const receiverResult = this.contractContext.emitExpression(call.receiver);
    const argResults = this.transformArguments(call.args);
    const allSetupLines = [...receiverResult.setupLines, ...this.combineSetupLines(argResults)];

    const methodName = call.target || "";

    const setupLines: string[] = [...allSetupLines];
    const callId = (++CallTransformer.callCounter).toString();

    const methodSignature = this.getMethodSignature(methodName);
    const selector = this.getMethodSelector(methodSignature);
    const argExprs = argResults.map((r) => r.valueExpr);

    if (selector !== 0) {
      setupLines.push(
        `const calldata_${callId} = ABI.encodeCallWithSelector(0x${selector.toString(16).padStart(8, "0")}, [${argExprs.join(", ")}]);`,
      );
    } else {
      setupLines.push(`const methodSig_${callId} = "${methodSignature}";`);
      setupLines.push(
        `const calldata_${callId} = ABI.encodeCall(methodSig_${callId}, [${argExprs.join(", ")}]);`,
      );
    }
    setupLines.push(
      `const callResult_${callId} = Calls.staticCall(InterfaceCast.getAddress(${receiverResult.valueExpr}), ABI.getPtr(calldata_${callId}), ABI.getLen(calldata_${callId}));`,
    );

    const functionReturnType = this.contractContext.currentFunctionReturnType || "unknown";

    setupLines.push(`if (!CallResult.isSuccess(callResult_${callId})) {`);

    if (functionReturnType === "void") {
      setupLines.push(`  return;`);
    } else {
      setupLines.push(`  return ${this.getDefaultReturnValue(functionReturnType)};`);
    }
    setupLines.push(`}`);

    const returnType = this.getMethodReturnType(methodName);

    if (functionReturnType === "void") {
      return {
        setupLines,
        valueExpr: "",
        valueType: "void",
      };
    }

    const decodedPtr = `ABI.decodeReturn(CallResult.getReturnData(callResult_${callId}), "${returnType}")`;
    const valueExpr = decodedPtr;

    return {
      setupLines,
      valueExpr,
      valueType: this.mapAbiTypeToTransformerType(returnType),
    };
  }

  /** Get method signature using dynamic interface analyzer with fallback to hardcoded signatures */
  private getMethodSignature(methodName: string): string {
    // Try dynamic signature first
    if (CallTransformer.interfaceAnalyzer) {
      const dynamicSignature = CallTransformer.interfaceAnalyzer.getMethodSignature(methodName);
      if (dynamicSignature) {
        return dynamicSignature;
      }
    }

    // Fallback to hardcoded signatures for backward compatibility
    const signatures: Record<string, string> = {
      balanceOf: "balanceOf(address)",
      transfer: "transfer(address,uint256)",
      totalSupply: "totalSupply()",
      name: "name()",
      symbol: "symbol()",
      decimals: "decimals()",
      ownerOf: "ownerOf(uint256)",
      transferFrom: "transferFrom(address,address,uint256)",
      approve: "approve(address,uint256)",
      getApproved: "getApproved(uint256)",
      getPrice: "getPrice(string)",
      updatePrice: "updatePrice(string,string)",
      isValidPriceData: "isValidPriceData()",
    };

    return signatures[methodName] || `${methodName}()`;
  }

  /** Get method selector for known interface methods */
  private getMethodSelector(signature: string): number {
    // Known Ethereum method selectors (pre-calculated with Keccak256)
    const knownSelectors: Record<string, number> = {
      // ERC20
      "name()": 0x06fdde03,
      "symbol()": 0x95d89b41,
      "decimals()": 0x313ce567,
      "totalSupply()": 0x18160ddd,
      "balanceOf(address)": 0x70a08231,
      "transfer(address,uint256)": 0xa9059cbb,
      "allowance(address,address)": 0xdd62ed3e,
      "approve(address,uint256)": 0x095ea7b3,
      "transferFrom(address,address,uint256)": 0x23b872dd,

      // ERC721
      "ownerOf(uint256)": 0x6352211e,
      "getApproved(uint256)": 0x081812fc,
      "setApprovalForAll(address,bool)": 0xa22cb465,
      "isApprovedForAll(address,address)": 0xe985e9c5,
      "safeTransferFrom(address,address,uint256)": 0x42842e0e,

      // Oracle
      "getPrice(string)": 0x8e15f473,
      "setPrice(string,uint256)": 0x91b7f5ed,
    };

    return knownSelectors[signature] || 0;
  }

  /** Get method return type using dynamic interface analyzer with fallback to hardcoded types */
  private getMethodReturnType(methodName: string): string {
    // Try dynamic return type first
    if (CallTransformer.interfaceAnalyzer) {
      const dynamicReturnType = CallTransformer.interfaceAnalyzer.getMethodReturnType(methodName);
      if (dynamicReturnType) {
        return dynamicReturnType;
      }
    }

    // Fallback to hardcoded types for backward compatibility
    const methodTypeMap: Record<string, string> = {
      balanceOf: "U256",
      totalSupply: "U256",
      decimals: "u8",
      name: "string",
      symbol: "string",
      transfer: "bool",
      transferFrom: "bool",
      approve: "bool",
      ownerOf: "Address",
      getApproved: "Address",
      getPrice: "U256",
      updatePrice: "bool",
      isValidPriceData: "bool",
    };

    return methodTypeMap[methodName] || "U256";
  }

  /** Get default return value based on type */
  private getDefaultReturnValue(type: string): string {
    const normalizedType =
      type === "uint256" ? "U256" : type === "address" ? "Address" : type === "void" ? "" : type;

    switch (normalizedType) {
      case "U256":
        return `U256.create()`;
      case "bool":
        return `Boolean.create()`;
      case "Address":
        return `Address.create()`;
      case "string":
        return `Str.create()`;
      case "u8":
        return `0`;
      case "":
        return ``;
      default:
        return `U256.create()`;
    }
  }

  /**
   * Maps ABI return types to transformer types for proper type detection
   */
  private mapAbiTypeToTransformerType(returnType: string): string {
    switch (returnType) {
      case "U256":
        return "uint256"; // This matches AbiType.Uint256 that U256 transformer expects
      case "Address":
        return "address"; // This matches AbiType.Address
      case "string":
        return "string"; // This matches AbiType.String
      case "bool":
        return "bool"; // This matches AbiType.Bool
      case "u8":
        return "uint256"; // Map u8 to uint256 since there's no specific u8 transformer
      default:
        return "uint256"; // Default to U256
    }
  }

  /**
   * Check if this is a U256 operation that needs special handling
   */
  private isU256Operation(call: Call): boolean {
    const u256Methods = [
      "add",
      "sub",
      "mul",
      "div",
      "mod",
      "pow",
      "equals",
      "lessThan",
      "greaterThan",
    ];
    const target = call.target || "";

    // Method calls with receiver (e.g., someVar.add(other))
    if (call.receiver && u256Methods.includes(target)) {
      return true;
    }

    // Check for dotted target patterns (e.g., "balance.mul")
    if (target.includes(".") && !call.receiver) {
      const methodName = target.split(".").pop();
      if (methodName && u256Methods.includes(methodName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if this is a Str.toABI call that needs special handling
   */
  private isStrToABICall(call: Call): boolean {
    if (!call.target || call.target !== "toABI") {
      return false;
    }

    if (!call.receiver || call.receiver.kind !== "var") {
      return false;
    }

    if ("name" in call.receiver && (call.receiver as any).name === "Str") {
      return true;
    }

    return false;
  }

  /**
   * Handle U256 operations by converting to static method calls
   */
  private handleU256Operation(call: Call): EmitResult {
    const argResults = this.transformArguments(call.args);
    let receiverExpr: string;
    let receiverSetupLines: string[] = [];
    let methodName: string;

    // Handle dotted target patterns (e.g., "balance.mul")
    if (call.target && call.target.includes(".") && !call.receiver) {
      const parts = call.target.split(".");
      methodName = parts.pop() || "";
      receiverExpr = parts.join(".");
    }
    // Handle regular receiver patterns (e.g., someVar.add)
    else if (call.receiver) {
      const receiverResult = this.contractContext.emitExpression(call.receiver);
      receiverExpr = receiverResult.valueExpr;
      receiverSetupLines = receiverResult.setupLines;
      methodName = call.target || "";
    }
    // Fallback for calls without receiver
    else {
      return {
        setupLines: [],
        valueExpr: "U256.create()",
        valueType: "uint256",
      };
    }

    const allSetupLines = [...receiverSetupLines, ...this.combineSetupLines(argResults)];
    const args = argResults.map((r) => r.valueExpr);

    // Convert to static method call
    const staticCall = `U256.${methodName}(${receiverExpr}, ${args.join(", ")})`;

    return {
      setupLines: allSetupLines,
      valueExpr: staticCall,
      valueType: "uint256",
    };
  }

  /**
   * Handle Address.equals calls properly to avoid delegation issues
   */
  private handleAddressEqualsCall(call: Call): EmitResult {
    const argResults = this.transformArguments(call.args);
    const allSetupLines = this.combineSetupLines(argResults);

    if (argResults.length >= 2) {
      return {
        setupLines: allSetupLines,
        valueExpr: `Address.equals(${argResults[0].valueExpr}, ${argResults[1].valueExpr})`,
        valueType: "bool",
      };
    }

    // Fallback for invalid args
    return {
      setupLines: allSetupLines,
      valueExpr: "false",
      valueType: "bool",
    };
  }

  /**
   * Handle Str.toABI calls with proper string literal handling
   */
  private handleStrToABICall(call: Call): EmitResult {
    const argResults = this.transformArguments(call.args);
    const allSetupLines = this.combineSetupLines(argResults);

    if (argResults.length > 0) {
      const arg = argResults[0];
      let argExpr = arg.valueExpr;

      // Check if the argument is a string literal (quoted string)
      if (argExpr.startsWith('"') && argExpr.endsWith('"')) {
        // Convert string literal to usize pointer using Str.fromString()
        argExpr = `Str.fromString(${argExpr})`;
      }

      return {
        setupLines: allSetupLines,
        valueExpr: `Str.toABI(${argExpr})`,
        valueType: "string",
      };
    }

    return {
      setupLines: allSetupLines,
      valueExpr: "Str.create()",
      valueType: "string",
    };
  }
}
