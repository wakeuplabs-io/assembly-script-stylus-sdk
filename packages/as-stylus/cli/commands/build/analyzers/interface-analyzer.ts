import { Project, SourceFile, InterfaceDeclaration, MethodSignature } from "ts-morph";
import path from "path";
import { fileURLToPath } from "url";

export interface InterfaceMethodInfo {
  name: string;
  signature: string;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
}

export interface InterfaceInfo {
  name: string;
  methods: Map<string, InterfaceMethodInfo>;
}

/** Analyzes TypeScript interfaces to generate dynamic method signatures for ABI calls */
export class InterfaceAnalyzer {
  private static instance: InterfaceAnalyzer;
  private interfaceCache = new Map<string, InterfaceInfo>();
  private project: Project;

  private constructor() {
    this.project = new Project({
      tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
      skipAddingFilesFromTsConfig: true,
    });
  }

  public static getInstance(): InterfaceAnalyzer {
    if (!InterfaceAnalyzer.instance) {
      InterfaceAnalyzer.instance = new InterfaceAnalyzer();
    }
    return InterfaceAnalyzer.instance;
  }

  public initialize(): void {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const interfacesDir = path.resolve(__dirname, "../../../sdk-interface/interfaces");
    
    const interfaceFiles = [
      path.join(interfacesDir, "ierc20.ts"),
      path.join(interfacesDir, "ierc721.ts"), 
      path.join(interfacesDir, "ioracle.ts"),
    ];

    interfaceFiles.forEach(filePath => {
      try {
        const sourceFile = this.project.addSourceFileAtPath(filePath);
        this.analyzeSourceFile(sourceFile);
      } catch {
        // Silently continue with fallback hardcoded signatures
      }
    });
  }

  private analyzeSourceFile(sourceFile: SourceFile): void {
    sourceFile.getInterfaces().forEach(interfaceDecl => {
      const interfaceInfo = this.analyzeInterface(interfaceDecl);
      this.interfaceCache.set(interfaceInfo.name, interfaceInfo);
    });
  }

  private analyzeInterface(interfaceDecl: InterfaceDeclaration): InterfaceInfo {
    const methods = new Map<string, InterfaceMethodInfo>();
    
    interfaceDecl.getMethods().forEach(method => {
      const methodInfo = this.analyzeMethod(method);
      methods.set(methodInfo.name, methodInfo);
    });

    return {
      name: interfaceDecl.getName(),
      methods,
    };
  }

  private analyzeMethod(method: MethodSignature): InterfaceMethodInfo {
    const methodName = method.getName();
    const parameters: Array<{ name: string; type: string }> = [];

    method.getParameters().forEach(param => {
      const paramName = param.getName();
      const paramTypeText = param.getTypeNode()?.getText() || "string";
      const paramType = this.mapTypeWithContext(paramTypeText, methodName, false);
      parameters.push({ name: paramName, type: paramType });
    });

    const returnTypeText = method.getReturnTypeNode()?.getText() || "void";
    const solidityReturnType = this.mapTypeWithContext(returnTypeText, methodName, true);
    const paramTypes = parameters.map(p => p.type).join(",");

    return {
      name: methodName,
      signature: `${methodName}(${paramTypes})`,
      returnType: solidityReturnType,
      parameters,
    };
  }

  /** Context-aware type mapping that considers method name and parameter position */
  private mapTypeWithContext(tsType: string, methodName: string, isReturnType: boolean): string {
    const cleanType = tsType.trim();

    // Return type mappings
    if (isReturnType) {
      switch (cleanType) {
        case "boolean":
          return "bool";
        case "number":
          return "uint8"; // decimals()
        case "string":
          // Methods that return actual strings vs addresses
          if (["name", "symbol"].includes(methodName)) {
            return "string";
          }
          // Methods that return addresses as strings
          if (["ownerOf", "getApproved"].includes(methodName)) {
            return "address";
          }
          return "string"; // Default string return type
        case "void":
          return "void";
        default:
          return "uint256"; // balanceOf, totalSupply, etc.
      }
    }

    // Parameter type mappings
    switch (cleanType) {
      case "boolean":
        return "bool";
      case "number":
        return "uint8";
      case "string":
        // String parameters are typically addresses or token amounts as strings
        if (["amount", "value", "tokenId", "price"].some(param => methodName.toLowerCase().includes(param))) {
          return "uint256";
        }
        return "address"; // owner, to, from, spender, operator, etc.
      default:
        return "uint256";
    }
  }

  /**
   * Get method signature for a given method name across all loaded interfaces
   */
  public getMethodSignature(methodName: string): string | null {
    for (const interfaceInfo of this.interfaceCache.values()) {
      const methodInfo = interfaceInfo.methods.get(methodName);
      if (methodInfo) {
        return methodInfo.signature;
      }
    }
    return null;
  }

  /**
   * Get method return type for a given method name
   */
  public getMethodReturnType(methodName: string): string | null {
    for (const interfaceInfo of this.interfaceCache.values()) {
      const methodInfo = interfaceInfo.methods.get(methodName);
      if (methodInfo) {
        return this.mapSolidityTypeToTransformerType(methodInfo.returnType);
      }
    }
    return null;
  }

  /**
   * Map Solidity types back to transformer types
   */
  private mapSolidityTypeToTransformerType(solidityType: string): string {
    switch (solidityType) {
      case "uint256":
        return "U256";
      case "address":
        return "Address";
      case "string":
        return "string";
      case "bool":
        return "bool";
      case "uint8":
        return "u8";
      case "void":
        return "void";
      default:
        return "U256";
    }
  }

  /**
   * Get all available interfaces
   */
  public getAvailableInterfaces(): string[] {
    return Array.from(this.interfaceCache.keys());
  }

  /**
   * Get all methods for a specific interface
   */
  public getInterfaceMethods(interfaceName: string): Map<string, InterfaceMethodInfo> | null {
    const interfaceInfo = this.interfaceCache.get(interfaceName);
    return interfaceInfo ? interfaceInfo.methods : null;
  }

  /**
   * Check if a method exists in any loaded interface
   */
  public isInterfaceMethod(methodName: string): boolean {
    for (const interfaceInfo of this.interfaceCache.values()) {
      if (interfaceInfo.methods.has(methodName)) {
        return true;
      }
    }
    return false;
  }
}