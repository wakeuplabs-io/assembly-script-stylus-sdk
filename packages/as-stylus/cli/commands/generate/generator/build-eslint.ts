import fs from "fs";
import path from "path";

const eslintConfig = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          String: {
            message: "Use 'Str' instead of 'String' for Stylus contracts",
            fixWith: "Str",
          },
          string: {
            message: "Use 'Str' instead of 'string' for Stylus contracts",
            fixWith: "Str",
          },
          Number: {
            message: "Use 'U256' or 'I256' instead of 'Number' for Stylus contracts",
          },
          number: {
            message: "Use 'U256' or 'I256' instead of 'number' for Stylus contracts",
          },
          BigInt: {
            message: "Use 'U256' or 'I256' instead of 'BigInt' for Stylus contracts",
          },
          bigint: {
            message: "Use 'U256' or 'I256' instead of 'bigint' for Stylus contracts",
          },
          Object: {
            message: "Use 'Struct' or 'Mapping' instead of 'Object' for Stylus contracts",
          },
          object: {
            message: "Use 'Struct' or 'Mapping' instead of 'object' for Stylus contracts",
          },
          Array: {
            message:
              "Arrays are not directly supported. Use 'Mapping' or 'Struct' for Stylus contracts",
          },
          "{}": {
            message:
              "Use specific types like 'Struct', 'Mapping', 'Address', 'U256', 'I256', or 'Str' instead of empty object type",
          },
          Function: {
            message: "Function types are not supported in Stylus contracts",
          },
          any: {
            message:
              "Avoid using 'any' type. Use specific types like 'Address', 'U256', 'I256', 'Str', 'bool', or 'void'",
          },
          unknown: {
            message:
              "Avoid using 'unknown' type. Use specific types like 'Address', 'U256', 'I256', 'Str', 'bool', or 'void'",
          },
        },
        extendDefaults: true,
      },
    ],
    "@typescript-eslint/no-explicit-any": "error",
  },
};

export function buildEslint(targetPath: string) {
  fs.writeFileSync(path.join(targetPath, ".eslintrc.json"), JSON.stringify(eslintConfig, null, 2));
}
