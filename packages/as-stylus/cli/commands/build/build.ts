import fs from "fs";
import path from "path";

import { IRContract } from "@/cli/types/ir.types.js";

import { applyAnalysis } from "./analyzers/index.js";

function getAllProjects(contractsRoot: string) {
  const folders = fs.readdirSync(contractsRoot);
  if (folders.length === 0) {
    console.error(
      "[as‑stylus] Error: No projects found.\n Make sure you have a project in the contracts folder.",
    );
    process.exit(1);
  }

  return folders.reduce((acc: string[], folder: string) => {
    if (folder.startsWith(".")) {
      return acc;
    }

    if (fs.statSync(path.join(contractsRoot, folder)).isDirectory()) {
      return [...acc, path.join(contractsRoot, folder)];
    }

    return acc;
  }, []);
}

function getAllContractPaths(projectRoot: string) {
  const contractPaths = fs.readdirSync(projectRoot);
  const projectName = projectRoot.split("/").pop();
  if (contractPaths.length === 0) {
    console.error(
      `
        [as‑stylus] Error: No contracts found.
        Make sure you have a [file].ts in the ${projectName} folder.
      `,
    );
    process.exit(1);
  }

  return contractPaths.reduce((acc: string[], contractPath: string) => {
    if (contractPath.endsWith(".ts")) {
      return [...acc, path.join(projectRoot, contractPath)];
    }
    return acc;
  }, []);
}

export function runBuild() {
  const contractsRoot = path.resolve(process.cwd(), "../contracts");
  const projects = getAllProjects(contractsRoot);

  projects.forEach((project) => {
    const contractPaths = getAllContractPaths(project);
    const projectName = project.split("/").pop()!;

    contractPaths.forEach(async (contractPath) => {
      const projectTargetPath = path.join(contractsRoot, ".dist", projectName);
      const contractName = contractPath.split("/").pop()!;
      const transformedPath = path.join(
        projectTargetPath,
        `${contractName.replace(".ts", "")}.transformed.ts`,
      );

      if (!fs.existsSync(projectTargetPath)) {
        console.log("Creating project", project);
        fs.mkdirSync(projectTargetPath, { recursive: true });
      }
      console.log(contractPath, transformedPath);
      fs.copyFileSync(contractPath, transformedPath);

      const contract: IRContract = applyAnalysis(transformedPath);
      // transformFromIR(contract, path.dirname(transformedPath));
      // buildProject(userIndexPath, contract);

      console.log(`Generated new contract project at: ${projectTargetPath}`);
    });
  });
}

runBuild();
