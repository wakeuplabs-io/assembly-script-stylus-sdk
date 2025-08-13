import fs from "fs";
import path from "path";

import { IRContract } from "@/cli/types/ir.types.js";
import { INTERMEDIATE_REPRESENTATION_PATH } from "@/cli/utils/constants.js";

import { SymbolTableStack } from "./shared/symbol-table.js";

/**
 * Exports the contract IR to a JSON file for visualization and analysis
 * @param contract The contract IR to export
 * @param outputDir Optional custom output directory
 * @returns Path to the generated JSON file
 */
export function exportContractToJSON(contract: IRContract, outputDir?: string): string {
  // Create the output directory if it doesn't exist
  const dir = outputDir || path.resolve(INTERMEDIATE_REPRESENTATION_PATH, "json");
  fs.mkdirSync(dir, { recursive: true });

  // Create filenames for complete contract and individual methods
  const contractFilePath = path.join(dir, `contract-${contract.name}.json`);

  // Add metadata to improve visualization experience
  const exportData = {
    ...contract,
    _metadata: {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      totalMethods: contract.methods.length,
      storageVariables: contract.storage.length,
    },
  };

  // Write complete contract to JSON file
  fs.writeFileSync(contractFilePath, JSON.stringify(exportData, null, 2));

  // Export individual methods to separate files for easier navigation
  if (contract.methods && contract.methods.length > 0) {
    const methodsDir = path.join(dir, `${contract.name}-methods`);
    fs.mkdirSync(methodsDir, { recursive: true });

    contract.methods.forEach((method) => {
      const methodFilePath = path.join(methodsDir, `${method.name}.json`);
      fs.writeFileSync(methodFilePath, JSON.stringify(method, null, 2));
    });
  }

  // Create an index file for easier navigation
  const indexData = {
    contractName: contract.name,
    storageCount: contract.storage.length,
    methods: contract.methods.map((m) => ({
      name: m.name,
      visibility: m.visibility,
      stateMutability: m.stateMutability,
      inputCount: m.inputs?.length || 0,
      outputCount: m.outputs?.length || 0,
      irStatementsCount: m.ir?.length || 0,
    })),
    hasConstructor: !!contract.constructor,
  };

  const indexFilePath = path.join(dir, `${contract.name}-index.json`);
  fs.writeFileSync(indexFilePath, JSON.stringify(indexData, null, 2));

  return contractFilePath;
}

/**
 * Generates a simplified tree view structure from contract IR for easier navigation
 * This can be used with tree view libraries in web interfaces
 * @param contract The contract IR to transform
 * @returns A tree structure ready for visualization
 */
export function generateContractTree(contract: IRContract) {
  // Create a tree structure that's easier to navigate visually
  const tree = {
    id: "root",
    name: contract.name,
    children: [
      {
        id: "storage",
        name: "Storage",
        children: contract.storage.map((item, index) => ({
          id: `storage-${index}`,
          name: `${item.name}: ${item.type}`,
          data: { slot: item.slot },
        })),
      },
      {
        id: "constructor",
        name: contract.constructor?.name || "Constructor",
        data: {
          visibility: contract.constructor?.visibility,
          stateMutability: contract.constructor?.stateMutability,
        },
        children:
          contract.constructor?.ir.map((stmt, index) => ({
            id: `constructor-stmt-${index}`,
            name: `Statement ${index + 1}: ${stmt.kind}`,
            data: stmt,
          })) || [],
      },
      {
        id: "methods",
        name: "Methods",
        children: contract.methods.map((method, methodIndex) => ({
          id: `method-${methodIndex}`,
          name: method.name,
          data: {
            visibility: method.visibility,
            stateMutability: method.stateMutability,
          },
          children: method.ir.map((stmt, stmtIndex) => ({
            id: `method-${methodIndex}-stmt-${stmtIndex}`,
            name: `Statement ${stmtIndex + 1}: ${stmt.kind}`,
            data: stmt,
          })),
        })),
      },
    ],
  };

  // Save the tree structure for visualization
  const dir = path.resolve(INTERMEDIATE_REPRESENTATION_PATH, "json");
  fs.mkdirSync(dir, { recursive: true });
  const treeFilePath = path.join(dir, `${contract.name}-tree.json`);
  fs.writeFileSync(treeFilePath, JSON.stringify(tree, null, 2));

  return tree;
}

export function exportSymbolTable(symbolTable: SymbolTableStack): void {
  const dir = path.resolve(INTERMEDIATE_REPRESENTATION_PATH, "json");
  fs.mkdirSync(dir, { recursive: true });
  const symbolTableFilePath = path.join(dir, `symbol-table.json`);
  fs.writeFileSync(symbolTableFilePath, JSON.stringify(symbolTable.toJSON(), null, 2));
}