import { type StructABIAnalysis } from "./types.js";

export function parseStructABIResponse(hexResponse: string): StructABIAnalysis {
  const bytes = hexResponse.startsWith("0x") ? hexResponse.slice(2) : hexResponse;
  const getSlot = (index: number) => bytes.slice(index * 64, (index + 1) * 64);

  const slots = [];
  const numSlots = bytes.length / 64;
  for (let i = 0; i < numSlots; i++) {
    slots.push(getSlot(i));
  }

  return {
    totalBytes: bytes.length / 2,
    slots,
    address: slots[0] || "",
    stringOffset: parseInt(slots[1] || "0", 16),
    value: parseInt(slots[2] || "0", 16),
    boolean: (slots[3] || "").slice(0, 2) === "01",
    value2: parseInt(slots[4] || "0", 16),
    stringLength: parseInt(slots[5] || "0", 16),
    stringContent: slots[6] || "",
  };
}

export function validateStructABIFormat(analysis: StructABIAnalysis): void {
  expect(analysis.totalBytes % 32).toBe(0);
  expect(analysis.stringOffset).toBe(160);
  expect(analysis.slots.length).toBeGreaterThanOrEqual(5);
}

export function validateStructFieldValues(
  analysis: StructABIAnalysis,
  expected: {
    address?: string;
    value?: number;
    boolean?: boolean;
    value2?: number;
    stringLength?: number;
  },
): void {
  if (expected.address !== undefined) {
    expect(analysis.address.toLowerCase()).toBe(expected.address.toLowerCase());
  }
  if (expected.value !== undefined) {
    expect(analysis.value).toBe(expected.value);
  }
  if (expected.boolean !== undefined) {
    expect(analysis.boolean).toBe(expected.boolean);
  }
  if (expected.value2 !== undefined) {
    expect(analysis.value2).toBe(expected.value2);
  }
  if (expected.stringLength !== undefined) {
    expect(analysis.stringLength).toBe(expected.stringLength);
  }
}

export function calculateExpectedStructSize(stringLength: number): number {
  const headerSize = 160;
  const lengthSlot = 32;
  const paddedContentSize = Math.ceil(stringLength / 32) * 32;
  return headerSize + lengthSlot + paddedContentSize;
}

export function validateStringContentInABI(stringContent: string, expectedLength: number): void {
  const contentBytes = stringContent.slice(0, expectedLength * 2);
  for (let i = 0; i < contentBytes.length; i += 2) {
    const byte = parseInt(contentBytes.slice(i, i + 2), 16);
    expect(byte).toBeGreaterThanOrEqual(0);
    expect(byte).toBeLessThanOrEqual(255);
  }
}
