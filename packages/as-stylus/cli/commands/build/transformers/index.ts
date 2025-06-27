/**
 * Main entry point for transformer registration
 * This file ensures all transformers are properly loaded
 */

// Import transformers to ensure they're registered
import "./u256/u256-transformer.js";
import "./address/address-transformer.js";
import "./string/string-transformer.js";
import "./boolean/boolean-transformer.js";
import "./msg/msg-transformer.js";
import "./event/event-transformer.js";
import "./struct/struct-transformer.js";

// Re-export key transformers functionality
export { transformFromIR } from "./core/transform-ir.js";
