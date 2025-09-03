import fs from "fs";
import path from "path";

/**
 * Detects if we're working within the AS-Stylus monorepo
 */
function isWithinMonorepo(cwd: string): boolean {
  let currentDir = cwd;
  
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

/**
 * Gets the package name for AS-Stylus imports
 * Always returns "@wakeuplabs/as-stylus" but ensures proper symlink resolution in development
 */
function getPackageName(): string {
  const cwd = process.cwd();
  
  // Ensure symlink exists when in monorepo development
  ensureSymlinkExists(cwd);
  
  // Always return the npm package name
  // Node.js will automatically resolve to symlink (development) or npm package (production)
  return "@wakeuplabs/as-stylus";
}

export function getUserEntrypointTemplate(): string {
  const packageName = getPackageName();

  return `
/* eslint-disable */

// Auto-generated contract template
import "./assembly/stylus/stylus";
import { __keep_imports } from "${packageName}/core/modules/keep-imports";
import { read_args, write_result } from "${packageName}/core/modules/hostio";
import { initHeap, malloc } from "${packageName}/core/modules/memory";
import { loadU32BE } from "${packageName}/core/modules/endianness";
import { Str } from "${packageName}/core/types/str";
import { Boolean } from "${packageName}/core/types/boolean";
import { U256 } from "${packageName}/core/types/u256";
import { createStorageKey } from "${packageName}/core/modules/storage";
import { storage_load_bytes32, storage_cache_bytes32, storage_flush_cache } from "${packageName}/core/modules/hostio";

// @logic_imports

__keep_imports(false);

const __SLOT00: u64 = 0;

function load_initialized_storage(): usize {
  const ptr = U256.create();
  storage_load_bytes32(createStorageKey(__SLOT00), ptr);
  return ptr;
}

function store_initialized_storage(ptr: usize): void {
  storage_cache_bytes32(createStorageKey(__SLOT00), ptr);
  storage_flush_cache(0);
}

function isFirstTimeDeploy(): bool {
  const init = load_initialized_storage();
  return init == 0;
}

export function user_entrypoint(args_len: usize): i32 {
  const position = memory.grow(<i32>((args_len + 0xffff) >> 16));
  read_args(position);
  initHeap(position, args_len);
  const selector: u32 =
    (<u32>load<u8>(position) << 24) |
    (<u32>load<u8>(position + 1) << 16) |
    (<u32>load<u8>(position + 2) << 8) |
    (<u32>load<u8>(position + 3));

  if (isFirstTimeDeploy()) {
    store_initialized_storage(Boolean.create(true));
    return 0;
  }

  // @user_entrypoint
  return 0;
}
`;
}
