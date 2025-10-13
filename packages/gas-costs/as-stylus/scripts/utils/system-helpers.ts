import { execSync } from "child_process";
import env from "../config/env";

export function run(cmd: string, cwd: string = env.ROOT, allowErr = false): string {
  try {
    return execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" }).trim();
  } catch (e: unknown) {
    if (!allowErr) throw e;
    const out = (e as { stdout?: string }).stdout ?? "";
    const err = (e as { stderr?: string }).stderr ?? "";
    return (out + err).trim();
  }
}

// Simple ANSI strip function without external dependency
export const stripAnsi = (s: string) => {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
};
