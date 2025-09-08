import { ContractContext } from "./contract-context.js";
import { TransformerRegistry } from "./transformer-registry.js";
import { IRContract, IRMethod } from "../../../../types/ir.types.js";
import { AddressTransformer } from "../address/address-transformer.js";
import { BlockTransformer } from "../block/block-transformer.js";
import { BooleanTransformer } from "../boolean/boolean-transformer.js";
import { CallsTransformer } from "../calls/calls-transformer.js";
import { ErrorTransformer, registerErrorTransformer } from "../error/error-transformer.js";
import { EventTransformer } from "../event/event-transformer.js";
import { registerEventTransformer } from "../event/utils/register-events.js";
import { ExpressionHandler } from "../expressions/expression-handler.js";
import { I256Transformer } from "../i256/i256-transformer.js";
import { MsgTransformer } from "../msg/msg-transformer.js";
import { StatementHandler } from "../statements/statement-handler.js";
import { StrTransformer } from "../string/string-transformer.js";
import { registerStructTransformer, StructTransformer } from "../struct/struct-transformer.js";
import { U256Transformer } from "../u256/u256-transformer.js";
import { generateArgsLoadBlock } from "../utils/args.js";
import { generateDeployFunction } from "../utils/deploy.js";
import { generateImports, generateStorageHelpers } from "../utils/storage.js";

interface ArgumentSignature {
  argsSignature: string;
  aliasLines: string[];
}

/**
 * Generates the method signature and argument aliasing for a given method
 * @param method Method to generate signature for
 * @returns Object containing signature and alias lines
 */
function generateMethodSignature(method: IRMethod): ArgumentSignature {
  const { callArgs } = generateArgsLoadBlock(method.inputs);
  const argsSignature = callArgs.map(arg => `${arg.name}: ${arg.type}`).join(", ");
  const aliasLines = method.inputs.map((inp, i) => `  const ${inp.name} = ${callArgs[i].name};`);
  
  if (method.inputs.some(inp => inp.type === "string")) {
    aliasLines.push(`  const argsStart: usize = arg0;`);
  }

  return {
    argsSignature,
    aliasLines,
  };
}

/**
 * Generates a single method's AssemblyScript code
 * @param method Method to generate code for
 * @returns Generated method code
 */
function generateMethod(method: IRMethod, contractContext: ContractContext): string {
  const statementHandler = new StatementHandler(contractContext);
  let returnType = "void";
  if (method.outputs && method.outputs.length > 0 && method.outputs[0].type !== "void") {
    returnType = "usize";
  }
  const { argsSignature, aliasLines } = generateMethodSignature(method);
  const body = statementHandler.handleStatements(method.ir);

  const methodLines = [
    `export function ${method.name}(${argsSignature}): ${returnType} {`,
    ...aliasLines.map(line => line),
    body,
    "}"
  ];

  return methodLines.join("\n");
}

/**
 * Generates the AssemblyScript code for a contract from its IR representation
 * @param contract IR representation of the contract
 * @returns Generated AssemblyScript code
 */
export function emitContract(contract: IRContract): string {
  // Initialize context-aware expression handler with contract information
  const transformerRegistry = new TransformerRegistry();
  const contractContext = new ContractContext(transformerRegistry, contract.name, contract.parent?.name);
  
  // Register type-specific transformers FIRST (highest priority)
  transformerRegistry.register(new U256Transformer(contractContext));
  transformerRegistry.register(new I256Transformer(contractContext));
  transformerRegistry.register(new AddressTransformer(contractContext));
  transformerRegistry.register(new StrTransformer(contractContext));
  transformerRegistry.register(new BooleanTransformer(contractContext));
  transformerRegistry.register(new MsgTransformer(contractContext));
  transformerRegistry.register(new BlockTransformer(contractContext));
  transformerRegistry.register(new CallsTransformer(contractContext));
  transformerRegistry.register(new ErrorTransformer(contractContext, contract.errors || []));
  transformerRegistry.register(new EventTransformer(contractContext, contract.events || []));
  transformerRegistry.register(new StructTransformer(contractContext, contract.structs || []));
  
  // Register ExpressionHandler LAST as fallback
  transformerRegistry.register(new ExpressionHandler(contractContext));

  const parts: string[] = [];

  // Add imports
  parts.push(generateImports(contract));

  // Add storage slots
  parts.push(...generateStorageHelpers(contract.storage, contract.structs || []));

  // Struct helpers
  parts.push(...registerStructTransformer(contract));

  // Add events
  if (contract.events && contract.events.length > 0) {
    parts.push(...registerEventTransformer(contract.events || [])); 
  }

  // Custom Errors
  parts.push(...registerErrorTransformer(contract));
  
  // Add constructor
  if (contract.constructor) {
    parts.push(generateDeployFunction(contract, contractContext));
    parts.push("");
  }

  // Add methods
  const methodParts = contract.methods.map(method => generateMethod(method, contractContext));
  
  // Add fallback and receive functions
  if (contract.fallback) {
    methodParts.push(generateMethod(contract.fallback, contractContext));
  }
  if (contract.receive) {
    methodParts.push(generateMethod(contract.receive, contractContext));
  }
  
  parts.push(...methodParts);

  return parts.join("\n");
}

