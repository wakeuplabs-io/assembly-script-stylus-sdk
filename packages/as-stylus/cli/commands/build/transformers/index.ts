/**
 * Main entry point for transformer registration
 * This file ensures all transformers are properly loaded
 */

// Import transformers to ensure they're registered
import './handlers/u256/u256-transformer.js';

// Re-export key transformers functionality
export { transformFromIR } from './core/transform-ir.js';
