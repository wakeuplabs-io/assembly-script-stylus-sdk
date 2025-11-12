import fs from "fs";
import path from "path";

export function buildTsconfigTest(targetPath: string) {
  fs.writeFileSync(
    path.join(targetPath, "tsconfig.test.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          module: "ESNext",
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          allowJs: true,
          strict: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          lib: ["ES2020", "DOM"],
          types: ["jest", "node"],
        },
        include: ["tests/**/*"],
        exclude: ["node_modules", "artifacts"],
      },
      null,
      2,
    ),
  );
}
