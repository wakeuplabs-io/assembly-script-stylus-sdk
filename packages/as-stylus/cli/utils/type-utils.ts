export function getReturnSize(type: string): number {
  switch (type) {
    case "U256":
      return 32;
    case "Address":
      return 20;
    case "boolean":
      return 1;
    case "string":
      return 32;
    default:
      return 32;
  }
}
