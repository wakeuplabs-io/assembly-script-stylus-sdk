/**
 * Interface casting wrapper for external contract calls.
 * Holds the target address and interface name for external calls.
 */
export class InterfaceCast {
  private address: usize;
  private interfaceName: string;

  /**
   * Creates a new interface cast wrapper
   * @param address - Target contract address (20 bytes)
   * @param interfaceName - Interface type name
   */
  constructor(address: usize, interfaceName: string) {
    this.address = address;
    this.interfaceName = interfaceName;
  }

  /**
   * Gets the target address
   * @returns Address pointer
   */
  getAddress(): usize {
    return this.address;
  }

  /**
   * Gets the interface name
   * @returns Interface type name
   */
  getInterfaceName(): string {
    return this.interfaceName;
  }

  /**
   * Creates an interface cast from an address
   * @param address - Target contract address
   * @param interfaceName - Interface type name
   * @returns InterfaceCast instance
   */
  static create(address: usize, interfaceName: string): InterfaceCast {
    return new InterfaceCast(address, interfaceName);
  }
}