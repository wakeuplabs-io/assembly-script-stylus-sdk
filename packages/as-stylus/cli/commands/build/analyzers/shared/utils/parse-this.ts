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
  // Remove "this." prefix and any modifiers (private, public, static, readonly)
  const name = nameDefinition
    .replace(/^this\./, '')
    .replace(/^(private|public|static|readonly)\s+/g, '')
    .replace(/\s*(private|public|static|readonly)\s*/g, ' ')
    .trim();
  const typeParsed = typeDefined.replace(/[\s;]/g, '');

  if (typeParsed.startsWith("Struct")) {
    return { name, type: typeParsed.split("<")[1].replace(">", "") };
  }

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