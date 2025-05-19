/**
 * Main entry point for transformer registration
 * This file ensures all transformers are properly loaded
 */

// Import transformers to ensure they're registered
import '../u256/u256-transformer.js';

// Re-export key transformers functionality
export { transformFromIR } from './transform-ir.js';
