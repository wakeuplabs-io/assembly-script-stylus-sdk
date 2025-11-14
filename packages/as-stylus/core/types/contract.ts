import { contract_address } from "../modules/hostio";
import { malloc } from "../modules/memory";

export class Contract {
  /**
   * Gets the address of the contract
   * Equivalent to Solidity's contract.address
   * @returns Pointer to 32-byte address representation of contract.address
   */
  public static address(): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 12; i++) {
      store<u8>(ptr + i, 0);
    }

    contract_address(ptr + 12);

    return ptr;
  }
}
