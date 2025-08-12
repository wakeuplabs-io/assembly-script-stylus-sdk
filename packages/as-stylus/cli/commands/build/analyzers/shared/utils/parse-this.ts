/**
 * Parses a string that may contain a "this." prefix and returns the name without the prefix.
 * @param name - The string to parse.
 * @returns The name without the "this." prefix.
 */
export function parseThis(name: string): string {
  return name.replace(/^this\./, '');
}

/**
 * Parses a string that may contain a "this." prefix and returns the name without the prefix.
 * @param definition - The string to parse.
 * @returns The name without the "this." prefix.
 */
export function parseName(definition: string, defaultType: string): { name: string, type: string } {
  const [nameDefinition, typeDefined = defaultType] = definition.split(":");
  const name = nameDefinition.replace(/^this\./, '');
  return { name, type: typeDefined };
}