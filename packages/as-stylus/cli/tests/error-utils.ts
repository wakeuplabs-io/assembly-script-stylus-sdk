import { Abi, BaseError, ContractFunctionRevertedError, Hex, decodeErrorResult } from "viem";

import { ContractError } from "./types.js";

const HEX_REGEX = /0x[a-fA-F0-9]+/;

export const UNKNOWN_ERROR: ContractError = { name: "Unknown", args: [] };
export const DECODE_ERROR: ContractError = { name: "DecodeError", args: [] };

function toMutableArgs(args: unknown): unknown[] {
  if (!Array.isArray(args)) return [];
  return [...args];
}

function extractHexCandidate(value: unknown): Hex | undefined {
  if (typeof value === "string" && value.startsWith("0x")) {
    return value as Hex;
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as Record<string, unknown>;

    for (const key of ["data", "raw"] as const) {
      const maybeHex = candidate[key];
      if (typeof maybeHex === "string" && maybeHex.startsWith("0x")) {
        return maybeHex as Hex;
      }
    }

    if (Array.isArray(candidate.metaMessages)) {
      for (const message of candidate.metaMessages) {
        if (typeof message === "string") {
          const match = message.match(HEX_REGEX);
          if (match?.[0]) {
            return match[0] as Hex;
          }
        }
      }
    }

    if ("cause" in candidate) {
      const nested = extractRevertData(candidate.cause);
      if (nested) return nested;
    }
  }

  return undefined;
}

export function extractRevertData(error: unknown): Hex | undefined {
  if (error instanceof BaseError) {
    const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError);

    if (revertError instanceof ContractFunctionRevertedError) {
      const { data } = revertError;

      if (typeof data === "string" && (data as string).startsWith("0x")) {
        return data as Hex;
      }

      if (data && typeof data === "object" && "data" in data) {
        const nested = (data as { data?: unknown }).data;
        if (typeof nested === "string" && nested.startsWith("0x")) {
          return nested as Hex;
        }
      }
    }

    if (typeof error.details === "string") {
      const match = error.details.match(HEX_REGEX);
      if (match?.[0]) {
        return match[0] as Hex;
      }
    }

    if (error.cause) {
      const nested = extractRevertData(error.cause);
      if (nested) return nested;
    }
  }

  return extractHexCandidate(error);
}

export function decodeContractError(abi: Abi, error: unknown): ContractError {
  const revertData = extractRevertData(error);
  if (!revertData || revertData === "0x") {
    return UNKNOWN_ERROR;
  }

  try {
    const { errorName, args } = decodeErrorResult({
      abi,
      data: revertData,
    });

    return {
      name: errorName,
      args: toMutableArgs(args),
    };
  } catch {
    return DECODE_ERROR;
  }
}
