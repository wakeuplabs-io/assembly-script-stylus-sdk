let __tempSerial = 0;

export function makeTemp(prefix = "t"): string {
  return `__${prefix}_${__tempSerial++}`;
}
