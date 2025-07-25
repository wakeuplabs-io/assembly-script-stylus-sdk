import fs from "fs";
import path from "path";

export function getCurrentWorkingDirectory(): string {
  return path.resolve(process.cwd());
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath Path to the directory to ensure exists
 * @returns The absolute path to the directory
 */
export function ensureDir(dirPath: string): string {
  const absolutePath = path.resolve(dirPath);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return absolutePath;
}

/**
 * Writes content to a file, ensuring the directory exists
 * @param filePath Path to the file to write
 * @param content Content to write to the file
 * @param options Optional write options
 */
export function writeFile(
  filePath: string,
  content: string | Buffer,
  options?: fs.WriteFileOptions,
): void {
  const dirPath = path.dirname(filePath);
  ensureDir(dirPath);
  fs.writeFileSync(filePath, content, options);
}

/**
 * Copies a file to a destination, ensuring the destination directory exists
 * @param srcPath Source file path
 * @param destPath Destination file path
 */
export function copyFile(srcPath: string, destPath: string): void {
  const dirPath = path.dirname(destPath);
  ensureDir(dirPath);
  fs.copyFileSync(srcPath, destPath);
}

/**
 * Reads a file and returns its content
 * @param filePath Path to the file to read
 * @param encoding Encoding to use (default: utf8)
 * @returns The content of the file
 */
export function readFile(filePath: string, encoding: BufferEncoding = "utf8"): string {
  return fs.readFileSync(filePath, encoding);
}
