import path from "path";
import { AbiStateMutability, toFunctionSelector, toFunctionSignature } from "viem";

import { IRContract, IRMethod } from "@/cli/types/ir.types.js";
import { writeFile } from "@/cli/utils/fs.js";
import { getReturnSize } from "@/cli/utils/type-utils.js";
import { getUserEntrypointTemplate } from "@/templates/entrypoint.js";

import { convertType } from "./build-abi.js";
import {
  generateArgsLoadBlock,
  generateArgsLoadBlockWithStringSupport,
} from "../transformers/utils/args.js";

/**
 * Extracts the struct name from a full type that might include import paths
 * Example: "import(...).StructTest" -> "StructTest"
 */
function extractStructName(fullType: string): string {
  // If it's an import path, extract only the final name
  if (fullType.includes(").")) {
    const parts = fullType.split(").");
    return parts[parts.length - 1];
  }

  // If it's just the name, return it as is
  return fullType;
}

function getFunctionSelector(method: IRMethod): string {
  const { name, inputs } = method;

  const signature = toFunctionSignature({
    name,
    type: "function",
    stateMutability: method.stateMutability as AbiStateMutability,
    inputs: inputs.map((input) => ({
      name: input.name,
      type: convertType(input.type),
    })),
    outputs: method.outputs.map((output) => ({
      name: output.name,
      type: convertType(output.type),
    })),
  });

  return toFunctionSelector(signature);
}

export function generateUserEntrypoint(contract: IRContract) {
  const imports: string[] = [];
  const entries: string[] = [];

  for (const method of contract.methods) {
    const { name, visibility, inputs, stateMutability } = method;

    if (["public", "external"].includes(visibility)) {
      // Create function signature: name(type1,type2,...)
      const sig = getFunctionSelector(method);
      imports.push(`import { ${name} } from "./contract.transformed";`);

      // Use string-aware args generator when strings are present
      const hasStrings = inputs.some((input) => input.type === "string" || input.type === "Str");
      const { argLines, callArgs } = hasStrings
        ? generateArgsLoadBlockWithStringSupport(inputs)
        : generateArgsLoadBlock(inputs);

      const outputType = method.outputs?.[0]?.type ?? "U256";
      let callLine = "";
      if (
        ["pure", "view"].includes(stateMutability) &&
        outputType !== "void" &&
        outputType !== "any"
      ) {
        if (outputType === "string" || outputType === "Str") {
          callLine = [
            `const buf = ${name}(${callArgs.join(", ")});`,
            `const len = loadU32BE(buf + 0x20 + 28);`,
            `const padded = ((len + 31) & ~31);`,
            `write_result(buf, 0x40 + padded);`,
            `return 0;`,
          ].join("\n    ");
        } else {
          // Check if the output type is a struct
          const structName = extractStructName(outputType);
          const structInfo = contract.structs?.find(s => s.name === structName);
          if (structInfo) {
            // For structs, we need to handle dynamic sizing
            if (structInfo.dynamic) {
              // Dynamic struct: calculate size based on string content at offset 160
              callLine = [
                `let ptr = ${name}(${callArgs.join(", ")});`,
                `const stringLen = loadU32BE(ptr + 160 + 28);`,
                `const paddedLen = (stringLen + 31) & ~31;`,
                `const totalSize = 160 + 32 + paddedLen;`,
                `write_result(ptr, totalSize);`,
                `return 0;`,
              ].join("\n    ");
            } else {
              // Static struct: use fixed size
              callLine = `let ptr = ${name}(${callArgs.join(", ")}); write_result(ptr, ${structInfo.size}); return 0;`;
            }
          } else {
            // Not a struct, use original logic
            const size = getReturnSize(outputType);
            callLine = `let ptr = ${name}(${callArgs.join(", ")}); write_result(ptr, ${size}); return 0;`;
          }
        }
      } else {
        callLine = `${name}(${callArgs.join(", ")}); return 0;`;
      }

      const indentedBody = [...argLines, callLine].map((line) => `    ${line}`).join("\n");
      entries.push(`  if (selector == ${sig}) {\n${indentedBody}\n  }`);
    }
  }

  const deployInputs = contract.constructor?.inputs || [];
  const deployHasStrings = deployInputs.some(
    (input) => input.type === "string" || input.type === "Str",
  );
  const { argLines, callArgs } = deployHasStrings
    ? generateArgsLoadBlockWithStringSupport(deployInputs)
    : generateArgsLoadBlock(deployInputs);

  const deploySig = getFunctionSelector({
    name: "deploy",
    visibility: "public",
    stateMutability: "nonpayable",
    inputs: deployInputs.map((input) => ({
      name: input.name,
      type: convertType(input.type),
    })),
    outputs: [],
    ir: [],
  });

  imports.push(`import { deploy } from "./contract.transformed";`);

  const callLine = `deploy(${callArgs.join(", ")}); return 0;`;
  const indentedBody = [...argLines, callLine].map((line) => `    ${line}`).join("\n");

  const deployEntry = `  if (selector == ${deploySig}) {\n${indentedBody}\n  }`;
  entries.push(deployEntry);

  return {
    imports: imports.join("\n"),
    entrypointBody: entries.join("\n"),
  };
}

export function buildEntrypoint(userFilePath: string, contract: IRContract): void {
  const { imports, entrypointBody } = generateUserEntrypoint(contract);
  const contractBasePath = path.dirname(userFilePath);

  let indexTemplate = getUserEntrypointTemplate();
  indexTemplate = indexTemplate.replace("// @logic_imports", imports);
  indexTemplate = indexTemplate.replace("// @user_entrypoint", entrypointBody);

  writeFile(path.join(contractBasePath, "entrypoint.ts"), indexTemplate);
}
