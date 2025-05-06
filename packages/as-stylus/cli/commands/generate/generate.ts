import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseContractsPath = path.resolve(__dirname, "../../contracts");

const contractName = process.argv[2];

if (!contractName) {
  console.error("Missing contract name. Usage: npm run generate <contract-name>");
  process.exit(1);
}

const targetPath = path.join(baseContractsPath, contractName);

if (fs.existsSync(targetPath)) {
  console.error(`Contract "${contractName}" already exists`);
  process.exit(1);
}

fs.mkdirSync(targetPath);

// asconfig.json
fs.writeFileSync(
  path.join(targetPath, "asconfig.json"),
  JSON.stringify({
    targets: {
      debug: {
        outFile: "build/module.wasm",
        textFile: "build/module.wat",
        jsFile: "build/module.js",
        optimizeLevel: 0,
        shrinkLevel: 0,
        sourceMap: true,
        noAssert: true,
        debug: true,
      },
      release: {
        outFile: "build/module.wasm",
        textFile: "build/module.wat",
        jsFile: "build/module.js",
        sourceMap: true,
        optimizeLevel: 0,
        shrinkLevel: 0,
        noAssert: true,
        converge: true,
      },
    },
    options: {
      bindings: "esm",
      runtime: "stub",
    },
  }, null, 2)
);

// index.ts
fs.writeFileSync(
  path.join(targetPath, "index.ts"),
`export function increment(): void { }

export function decrement(): void { }

export function get(): u64 {
  return 1;
}
`
);

// package.json
fs.writeFileSync(
  path.join(targetPath, "package.json"),
  JSON.stringify({
    name: contractName,
    version: "1.0.0",
    description: "",
    main: "index.js",
    scripts: {
      build: "cd .dist && npm run build",
      check: "cd .dist && npm run check",
      deploy: "cd .dist && npm run deploy",
    },
    author: "",
    license: "ISC",
    type: "module",
    exports: {
      ".": {
        import: "./build/release.js",
        types: "./build/release.d.ts",
      },
    },
    devDependencies: {
      assemblyscript: "^0.27.35",
    },
  }, null, 2)
);

// tsconfig.json
fs.writeFileSync(
  path.join(targetPath, "tsconfig.json"),
  JSON.stringify({
    extends: "assemblyscript/std/assembly.json",
    include: ["index.ts"],
  }, null, 2)
);

console.log(`Contract "${contractName}" created successfully at ${targetPath}`);
