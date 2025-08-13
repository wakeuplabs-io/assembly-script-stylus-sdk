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
  const typeParsed = typeDefined.replace(/[\s;]/g, '');
  return { name, type: typeParsed };
}

/**
 * Parses a string that may contain a "this." prefix and returns the name without the prefix.
 * @param definition - The string to parse.
 * @returns The name and method.
 */
export function parseNameWithMethod(definition: string): { name: string, method: string } {
  const [nameDefinition, methodDefinition] = parseThis(definition).split(".");
  return { name: nameDefinition, method: methodDefinition?.split("(")[0] };
}