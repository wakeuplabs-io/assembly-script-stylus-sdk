/**
 * Calculate method selector using the same algorithm as Ethereum
 * For now, we'll use the known selectors until we can add proper Keccak256
 * @param signature - Method signature like "transfer(address,uint256)"
 * @returns 4-byte method selector as u32
 */
export function calculateMethodSelector(signature: string): number {
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

/**
 * Generate a TypeScript/AssemblyScript code snippet for method selectors
 * @param interfaces - Map of interface names to their methods
 * @returns Generated code as string
 */
export function generateMethodSelectorsCode(
  interfaces: Map<string, Map<string, { signature: string }>>,
): string {
  const lines: string[] = [];

  lines.push("// Auto-generated method selectors from interface definitions");
  lines.push("export class MethodSelectors {");
  lines.push("  private static selectors: Map<string, u32> = new Map<string, u32>();");
  lines.push("");
  lines.push("  static initialize(): void {");
  lines.push("    if (MethodSelectors.selectors.size > 0) return;");
  lines.push("");

  // Generate selector entries for each interface method
  for (const [interfaceName, methods] of interfaces) {
    lines.push(`    // ${interfaceName} methods`);
    for (const [_methodName, methodInfo] of methods) {
      const selector = calculateMethodSelector(methodInfo.signature);
      lines.push(
        `    MethodSelectors.selectors.set("${methodInfo.signature}", 0x${selector.toString(16)});`,
      );
    }
    lines.push("");
  }

  lines.push("  }");
  lines.push("");
  lines.push("  static getSelector(signature: string): u32 {");
  lines.push("    MethodSelectors.initialize();");
  lines.push("    return MethodSelectors.selectors.get(signature) || 0;");
  lines.push("  }");
  lines.push("}");

  return lines.join("\n");
}
