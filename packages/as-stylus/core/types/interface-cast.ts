import { debugLogI32 } from "../modules/console";
import { malloc } from "../modules/memory";
import { Address } from "./address";

/**
 * Interface casting wrapper for external contract calls.
 * Holds the target address and interface name for external calls.
 */
export class InterfaceCast {
  /**
   * Creates an interface cast structure safely without using new
   * Layout: [address:20 bytes][interfaceName:usize] = 28 bytes total
   * @param address - Target contract address  
   * @param interfaceName - Interface type name
   * @returns Pointer to InterfaceCast structure
   */
  static create(address: usize, interfaceName: string): usize {
    const ptr = malloc(20 + 8); // 20 bytes address + 8 bytes for interface name pointer = 28 bytes
    
    // Copy the 20 bytes of address data, not the pointer
    memory.copy(ptr, address, Address.ADDRESS_SIZE);
    store<usize>(ptr + 20, changetype<usize>(interfaceName)); // Store interface name pointer after address
    // debugLogI32(1000);
    // for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
    //   debugLogI32(load<u8>(address + i));
    // }
    // debugLogI32(1001);
    return ptr;
  }

  /**
   * Gets the address from an InterfaceCast structure
   * @param interfaceCastPtr - Pointer to InterfaceCast structure
   * @returns Address pointer
   */
  static getAddress(interfaceCastPtr: usize): usize {
    // The address data is stored directly at the beginning of the structure
    // debugLogI32(10000);
    // for (let i: u32 = 0; i < Address.ADDRESS_SIZE; ++i) {
    //   debugLogI32(load<u8>(interfaceCastPtr + i));
    // }
    // debugLogI32(10001);
    return interfaceCastPtr; // Return pointer to the address data
  }

  /**
   * Gets the interface name from an InterfaceCast structure  
   * @param interfaceCastPtr - Pointer to InterfaceCast structure
   * @returns Interface name string
   */
  static getInterfaceName(interfaceCastPtr: usize): string {
    const namePtr = load<usize>(interfaceCastPtr + 20); // Interface name is after 20 bytes of address
    return changetype<string>(namePtr);
  }
}