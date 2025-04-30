import { Project } from "ts-morph";
import { transformNewU256 } from "./u256/new-u256.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from 'fs'
const USER_CONTRACT_PATH = "../../contracts/test-1/index.ts";
const USER_PRE_PROCCESSED_CONTRACT_PATH = "../../contracts/test-1/.dist/index.transformed.ts";

export function applyTransforms() {
  console.log("Applying AST transforms...");
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const userFilePath = path.resolve(__dirname, USER_CONTRACT_PATH);
  const distFilePath = path.resolve(__dirname, USER_PRE_PROCCESSED_CONTRACT_PATH);
  fs.copyFileSync(userFilePath, distFilePath);
  
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(distFilePath);
  transformNewU256(sourceFile)  
  
  console.log("Transforms completed.");
}