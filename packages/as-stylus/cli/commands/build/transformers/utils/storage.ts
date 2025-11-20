import fs from "fs";
import path from "path";

import { AbiType } from "@/cli/types/abi.types.js";
import { IRContract, IRStruct, IRVariable } from "@/cli/types/ir.types.js";

/**
 * Detects if we're working within the AS-Stylus monorepo
 */
function isWithinMonorepo(cwd: string): boolean {
  let currentDir = cwd;

  // Search up to 5 levels for the monorepo structure
  for (let i = 0; i < 5; i++) {
    const potentialSdkPath = path.join(currentDir, "packages", "as-stylus", "core");
    const potentialPackageJson = path.join(currentDir, "packages", "as-stylus", "package.json");

    if (fs.existsSync(potentialSdkPath) && fs.existsSync(potentialPackageJson)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(potentialPackageJson, "utf-8"));
        if (packageJson.name === "@wakeuplabs/as-stylus") {
          return true;
        }
      } catch (e) {
        // Continue searching if package.json can't be read
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Reached filesystem root
    currentDir = parentDir;
  }

  return false;
}

/**
 * Finds the AS-Stylus SDK root directory when within monorepo
 */
function findSdkRoot(cwd: string): string | null {
  let currentDir = cwd;

  // First, find the monorepo root (directory containing packages/as-stylus)
  for (let i = 0; i < 5; i++) {
    const potentialSdkPath = path.join(currentDir, "packages", "as-stylus");
    const potentialPackageJson = path.join(potentialSdkPath, "package.json");

    if (fs.existsSync(potentialPackageJson)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(potentialPackageJson, "utf-8"));
        if (packageJson.name === "@wakeuplabs/as-stylus") {
          return potentialSdkPath;
        }
      } catch (e) {
        // Continue searching
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  // If not found above, check if we're already inside as-stylus directory
  currentDir = cwd;
  for (let i = 0; i < 5; i++) {
    const potentialPackageJson = path.join(currentDir, "package.json");

    if (fs.existsSync(potentialPackageJson)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(potentialPackageJson, "utf-8"));
        if (packageJson.name === "@wakeuplabs/as-stylus") {
          return currentDir;
        }
      } catch (e) {
        // Continue searching
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Ensures symlink exists for development when within monorepo
 */
function ensureSymlinkExists(cwd: string): void {
  if (!isWithinMonorepo(cwd)) {
    return; // Not in monorepo, nothing to do
  }

  const nodeModulesPath = path.join(cwd, "node_modules");
  const wakeupLabsPath = path.join(nodeModulesPath, "@wakeuplabs");
  const symlinkPath = path.join(wakeupLabsPath, "as-stylus");

  // If symlink already exists and is valid, we're good
  if (fs.existsSync(symlinkPath)) {
    try {
      const stats = fs.lstatSync(symlinkPath);
      if (stats.isSymbolicLink()) {
        const target = fs.readlinkSync(symlinkPath);
        const absoluteTarget = path.resolve(path.dirname(symlinkPath), target);
        if (fs.existsSync(path.join(absoluteTarget, "core"))) {
          return; // Valid symlink exists
        }
      }
    } catch (e) {
      // Symlink is broken, we'll recreate it
    }
  }

  const sdkRoot = findSdkRoot(cwd);
  if (!sdkRoot) {
    return; // Can't find SDK root
  }

  try {
    // Ensure @wakeuplabs directory exists
    if (!fs.existsSync(nodeModulesPath)) {
      fs.mkdirSync(nodeModulesPath, { recursive: true });
    }
    if (!fs.existsSync(wakeupLabsPath)) {
      fs.mkdirSync(wakeupLabsPath, { recursive: true });
    }

    // Remove existing symlink if it exists and is broken
    if (fs.existsSync(symlinkPath)) {
      fs.unlinkSync(symlinkPath);
    }

    // Create relative symlink to SDK root
    const relativePath = path.relative(wakeupLabsPath, sdkRoot);
    fs.symlinkSync(relativePath, symlinkPath);
  } catch (error) {
    // Symlink creation failed, but we'll continue anyway
    console.warn(`Warning: Could not create symlink for local AS-Stylus development: ${error}`);
  }
}

function formatSlotName(slot: number): string {
  return `__SLOT${slot.toString(16).padStart(2, "0")}`;
}

/**
 * Gets the package name for AS-Stylus imports
 * Always returns "@wakeuplabs/as-stylus" but ensures proper symlink resolution in development
 */
function getPackageName(): string {
  const cwd = process.cwd();
  ensureSymlinkExists(cwd);
  return "@wakeuplabs/as-stylus";
}

export function loadSimple(name: string, slot: number, type?: AbiType): string {
  let createCall = "U256.create()";
  const returnSentence = type === AbiType.Bool ? "return Boolean.fromABI(ptr);" : "return ptr;";
  const returnType = type === AbiType.Bool ? "boolean" : "usize";

  switch (type) {
    case AbiType.Address:
      createCall = "Address.create()";
      break;
    case AbiType.Bool:
      createCall = "Boolean.create()";
      break;
    case AbiType.Uint256:
      createCall = "U256.create()";
      break;
    case AbiType.Int256:
      createCall = "I256.create()";
      break;
    default:
      createCall = "U256.create()";
      break;
  }

  return `
function load_${name}(): ${returnType} {
  const ptr = ${createCall};
  storage_load_bytes32(createStorageKey(${formatSlotName(slot)}), ptr);
  ${returnSentence}
}`;
}

export function storeSimple(name: string, slot: number): string {
  return `
function store_${name}(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(${formatSlotName(slot)}), ptr);
  storage_flush_cache(0);
}`;
}

export function storeBoolean(name: string, slot: number): string {
  return `
function store_${name}(value: boolean): void {
  storage_cache_bytes32(createStorageKey(${formatSlotName(slot)}), Boolean.create(value));
  storage_flush_cache(0);
}`;
}

export function generateImports(contract: IRContract): string {
  const lines: string[] = ["// eslint-disable-next-line import/namespace"];
  const packageName = getPackageName();
  const types = contract.symbolTable.getTypes();
  const hasEvents = contract.events && contract.events.length > 0;
  const hasErrors = contract.errors && contract.errors.length > 0;

  if (types.size === 0) {
    return "";
  }

  const hasSimple =
    types.has(AbiType.String) ||
    types.has(AbiType.Bool) ||
    types.has(AbiType.Address) ||
    types.has(AbiType.Uint256);

  if (hasSimple) {
    lines.push(
      "import {",
      "  storage_load_bytes32,",
      "  storage_cache_bytes32,",
      "  storage_flush_cache,",
      `} from "${packageName}/core/modules/hostio";`,
      `import { createStorageKey } from "${packageName}/core/modules/storage";`,
    );
  }

  if (hasErrors) {
    lines.push(`import { abort_with_data } from "${packageName}/core/modules/errors";`);
  }

  if (hasEvents) {
    lines.push(`import { addTopic, emitTopics } from "${packageName}/core/modules/events";`);
  }

  if (types.has(AbiType.Mapping)) {
    lines.push(`import { Mapping } from "${packageName}/core/types/mapping";`);
  }

  if (types.has(AbiType.MappingNested)) {
    lines.push(`import { MappingNested } from "${packageName}/core/types/mapping2";`);
  }

  if (types.has(AbiType.Bool)) {
    lines.push(`import { Boolean } from "${packageName}/core/types/boolean";`);
  }

  if (types.has(AbiType.Address)) {
    lines.push(`import { Address } from "${packageName}/core/types/address";`);
  }

  if (types.has(AbiType.Uint256)) {
    lines.push(`import { U256 } from "${packageName}/core/types/u256";`);
  }

  if (types.has(AbiType.Int256)) {
    lines.push(`import { I256 } from "${packageName}/core/types/i256";`);
  }

  if (types.has(AbiType.String)) {
    lines.push(`import { Str } from "${packageName}/core/types/str";`);
    lines.push(`import { loadU32BE } from "${packageName}/core/modules/endianness";`);
  }

  if (
    types.has(AbiType.Array) ||
    types.has(AbiType.ArrayStatic) ||
    types.has(AbiType.ArrayDynamic)
  ) {
    lines.push(`import { Array } from "${packageName}/core/types/array";`);
  }

  if (
    types.has(AbiType.ArrayStatic) ||
    contract.storage.some((v: any) => v.kind === "array_static")
  ) {
    lines.push(`import { ArrayStatic } from "${packageName}/core/types/array-static";`);
  }

  if (types.has(AbiType.ArrayDynamic)) {
    lines.push(`import { ArrayDynamic } from "${packageName}/core/types/array-dynamic";`);
  }

  // Import array factories if arrays are used
  if (
    types.has(AbiType.Array) ||
    types.has(AbiType.ArrayStatic) ||
    types.has(AbiType.ArrayDynamic) ||
    contract.storage.some((v: any) => v.kind === "array_static" || v.kind === "array_dynamic")
  ) {
    lines.push(`import { U256ArrayFactory } from "${packageName}/core/types/array-factories";`);
  }

  const hasCallFactory = contract.methods.some((method) =>
    method.ir.some((statement: unknown) => JSON.stringify(statement).includes("CallFactory")),
  );

  const hasInterfaceCasts = contract.methods.some((method) =>
    method.ir.some((statement: unknown) => JSON.stringify(statement).includes("interface_cast")),
  );

  if (hasCallFactory || hasInterfaceCasts) {
    lines.push(`import { Calls, CallResult } from "${packageName}/core/modules/calls";`);
    lines.push(`import { U256Factory } from "${packageName}/cli/sdk-interface/u256";`);
    lines.push(`import { AddressFactory } from "${packageName}/cli/sdk-interface/address";`);
  }

  lines.push(`import { Struct } from "${packageName}/core/types/struct";`);
  lines.push(`import { StructMemory } from "${packageName}/core/memory/struct";`);
  lines.push(`import { Msg } from "${packageName}/core/types/msg";`);
  lines.push(`import { Contract } from "${packageName}/core/types/contract";`);
  lines.push(`import { Block } from "${packageName}/core/types/block";`);
  lines.push(`import { malloc } from "${packageName}/core/modules/memory";`);

  lines.push("");
  return lines.join("\n");
}

function generateStructStorageFunctions(variable: IRVariable, struct: IRStruct): string[] {
  const lines: string[] = [];
  const numSlots = Math.ceil(struct.size / 32);

  let loadBody = `  const ptr = Struct.alloc(${struct.size});`;
  for (let i = 0; i < numSlots; i++) {
    const slotValue = variable.slot + i;
    const slotName = formatSlotName(slotValue);
    const offset = i * 32;
    loadBody += `\n  Struct.loadFromStorage(ptr${offset > 0 ? ` + ${offset}` : ""}, ${slotName});`;
  }
  loadBody += `\n  return ptr;`;

  lines.push(`
function load_${variable.name}(): usize {
${loadBody}
}`);

  let storeBody = "";
  for (let i = 0; i < numSlots; i++) {
    const slotValue = variable.slot + i;
    const slotName = formatSlotName(slotValue);
    const offset = i * 32;
    storeBody += `  Struct.storeToStorage(ptr${offset > 0 ? ` + ${offset}` : ""}, ${slotName});\n`;
  }
  storeBody += `  Struct.flushStorage();`;

  lines.push(`
function store_${variable.name}(ptr: usize): void {
${storeBody}
}`);

  return lines;
}

export function generateStorageHelpers(
  variables: IRVariable[],
  structs: IRStruct[] = [],
): string[] {
  const lines: string[] = [];
  const structMap = new Map(structs.map((s) => [s.name, s]));

  lines.push(""); // Add empty line

  for (const variable of variables) {
    if (variable.kind === "simple") {
      switch (variable.type) {
        case AbiType.String:
          lines.push(
            `
function load_${variable.name}(): usize {
  return Str.loadFrom(${formatSlotName(variable.slot)});
}

function store_${variable.name}(ptr: usize): void {
  Str.storeTo(${formatSlotName(variable.slot)}, ptr);
}`.trim(),
          );
          break;

        case AbiType.Bool:
          lines.push(loadSimple(variable.name, variable.slot, variable.type));
          lines.push(storeBoolean(variable.name, variable.slot));
          break;
        case AbiType.Address:
        case AbiType.Uint256:
        case AbiType.Int256:
          lines.push(loadSimple(variable.name, variable.slot, variable.type));
          lines.push(storeSimple(variable.name, variable.slot));
          break;

        case AbiType.Struct:
          if (variable.originalType && structMap.has(variable.originalType)) {
            const struct = structMap.get(variable.originalType);
            if (struct) {
              lines.push(...generateStructStorageFunctions(variable, struct));
            }
          } else {
            lines.push(loadSimple(variable.name, variable.slot, variable.type as AbiType));
            lines.push(storeSimple(variable.name, variable.slot));
          }
          break;

        default:
          lines.push(loadSimple(variable.name, variable.slot, variable.type as AbiType));
          lines.push(storeSimple(variable.name, variable.slot));
          break;
      }
    } else if (variable.kind === "array_static") {
      // Static array storage functions
      lines.push(`
function load_${variable.name}(): usize {
  // Always create a fresh metadata structure pointing to the correct storage slots
  const arrayPtr = ArrayStatic.createStorage(32, ${variable.length}); // elementSize=32 for U256
  ArrayStatic.setBaseSlot(arrayPtr, ${variable.slot});
  return arrayPtr;
}

function store_${variable.name}(ptr: usize): void {
  // Static arrays store elements directly in consecutive slots using the global variable
  // The actual slot assignment is handled by ArrayStatic.setBaseSlot()
}`);
    } else if (variable.kind === "array_dynamic") {
      // Dynamic array storage functions
      lines.push(`
export function load_${variable.name}(): usize {
  return createStorageKey(${formatSlotName(variable.slot)});
}

function store_${variable.name}(ptr: usize): void {
  // Dynamic arrays store length at base slot
  // Storage is handled automatically through storage_cache_bytes32/storage_flush_cache
}`);
    }
  }

  return lines;
}
