export const getEslintFileTemplate = () => {
  return `{
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": ["eslint:recommended"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "semi": ["error", "always"],
    "no-restricted-globals": [
      "error",
      {
        "name": "Math",
        "message": "Math is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "String",
        "message": "String is not available in AssemblyScript. Import and use Str from @wakeuplabs/as-stylus instead."
      },
      {
        "name": "Array",
        "message": "Array is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "Object",
        "message": "Object is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "Date",
        "message": "Date is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "JSON",
        "message": "JSON is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "Boolean",
        "message": "Boolean is not available in AssemblyScript. Use the boolean primitive type or import from SDK instead."
      },
      {
        "name": "Number",
        "message": "Number is not available in AssemblyScript. Import and use appropriate numeric types instead."
      },
      {
        "name": "RegExp",
        "message": "RegExp is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "Error",
        "message": "Error is not available in AssemblyScript. Import and use appropriate error handling instead."
      },
      {
        "name": "Promise",
        "message": "Promise is not available in AssemblyScript. Use synchronous operations or import from SDK instead."
      },
      {
        "name": "Map",
        "message": "Map is not available in AssemblyScript. Import and use Mapping from @wakeuplabs/as-stylus instead."
      },
      {
        "name": "Set",
        "message": "Set is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "WeakMap",
        "message": "WeakMap is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "WeakSet",
        "message": "WeakSet is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "Symbol",
        "message": "Symbol is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "Proxy",
        "message": "Proxy is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "Reflect",
        "message": "Reflect is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "console",
        "message": "console is not available in AssemblyScript. Import and use appropriate logging methods instead."
      },
      {
        "name": "window",
        "message": "window is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "document",
        "message": "document is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "global",
        "message": "global is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "globalThis",
        "message": "globalThis is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "process",
        "message": "process is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "Buffer",
        "message": "Buffer is not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "name": "setTimeout",
        "message": "setTimeout is not available in AssemblyScript. Use synchronous operations instead."
      },
      {
        "name": "setInterval",
        "message": "setInterval is not available in AssemblyScript. Use synchronous operations instead."
      },
      {
        "name": "clearTimeout",
        "message": "clearTimeout is not available in AssemblyScript. Use synchronous operations instead."
      },
      {
        "name": "clearInterval",
        "message": "clearInterval is not available in AssemblyScript. Use synchronous operations instead."
      },
      {
        "name": "fetch",
        "message": "fetch is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "XMLHttpRequest",
        "message": "XMLHttpRequest is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "localStorage",
        "message": "localStorage is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "sessionStorage",
        "message": "sessionStorage is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "atob",
        "message": "atob is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "btoa",
        "message": "btoa is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "encodeURIComponent",
        "message": "encodeURIComponent is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "decodeURIComponent",
        "message": "decodeURIComponent is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "isNaN",
        "message": "isNaN is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "isFinite",
        "message": "isFinite is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "parseInt",
        "message": "parseInt is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "parseFloat",
        "message": "parseFloat is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "escape",
        "message": "escape is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "name": "unescape",
        "message": "unescape is not available in AssemblyScript. Import and use appropriate SDK methods instead."
      }
    ],
    "no-restricted-properties": [
      "error",
      {
        "object": "Math",
        "message": "Math methods are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "String",
        "message": "String methods are not available in AssemblyScript. Import and use Str methods from @wakeuplabs/as-stylus instead."
      },
      {
        "object": "Array",
        "message": "Array methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "object": "Object",
        "message": "Object methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "object": "Date",
        "message": "Date methods are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "JSON",
        "message": "JSON methods are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "Boolean",
        "message": "Boolean methods are not available in AssemblyScript. Use the boolean primitive type or import from SDK instead."
      },
      {
        "object": "Number",
        "message": "Number methods are not available in AssemblyScript. Import and use appropriate numeric types instead."
      },
      {
        "object": "RegExp",
        "message": "RegExp methods are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "Error",
        "message": "Error methods are not available in AssemblyScript. Import and use appropriate error handling instead."
      },
      {
        "object": "Promise",
        "message": "Promise methods are not available in AssemblyScript. Use synchronous operations or import from SDK instead."
      },
      {
        "object": "Map",
        "message": "Map methods are not available in AssemblyScript. Import and use Mapping from @wakeuplabs/as-stylus instead."
      },
      {
        "object": "Set",
        "message": "Set methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "object": "WeakMap",
        "message": "WeakMap methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "object": "WeakSet",
        "message": "WeakSet methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "object": "Symbol",
        "message": "Symbol methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "object": "Proxy",
        "message": "Proxy methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      },
      {
        "object": "Reflect",
        "message": "Reflect methods are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "console",
        "message": "console methods are not available in AssemblyScript. Import and use appropriate logging methods instead."
      },
      {
        "object": "window",
        "message": "window properties are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "document",
        "message": "document properties are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "global",
        "message": "global properties are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "globalThis",
        "message": "globalThis properties are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "process",
        "message": "process properties are not available in AssemblyScript. Import and use appropriate SDK methods instead."
      },
      {
        "object": "Buffer",
        "message": "Buffer methods are not available in AssemblyScript. Import and use appropriate SDK types instead."
      }
    ]
  }
}`;
};
