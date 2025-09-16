/**
 * Helper method to combine setup lines with proper indentation
 */
export function combineLines(lines: string[], indent: string): string {
  return lines
    .filter((line) => line.trim() !== "")
    .map((line) => `${indent}${line}`)
    .join("\n");
}
