import { initHeap } from "../../as-stylus/core/modules/memory";
import { 
  testCreate,
  testFromABIPrimitives,
  testFromABIPointers,
  testToABIPrimitives,
  testToABIPreservation,
  testNot,
  testRoundTrip,
  testEdgeCases,
  testToABIEdgeValues,
  testFromABIConsistency,
  testToABIIdempotence,
  testChainOperations,
  testRepeatedOperations,
  testComprehensive
} from "./boolean/tests";

/**
 * Initialize heap to start from a safe memory location
 */
initHeap(1024, 0);

/**
 * Basic arithmetic function to verify WASM module functionality
 * @param a - First integer operand
 * @param b - Second integer operand
 * @returns Sum of a and b
 */
export function add(a: i32, b: i32): i32 {
  return a + b;
}

/**
 * Export all Boolean test methods for external access
 */
export { 
  testCreate,
  testFromABIPrimitives,
  testFromABIPointers,
  testToABIPrimitives,
  testToABIPreservation,
  testNot,
  testRoundTrip,
  testEdgeCases,
  testToABIEdgeValues,
  testFromABIConsistency,
  testToABIIdempotence,
  testChainOperations,
  testRepeatedOperations,
  testComprehensive
};