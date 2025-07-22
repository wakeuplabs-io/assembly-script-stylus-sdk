import { Address } from "./address.js";
import { U256 } from "./u256.js";

export class msg {
  static sender: Address;
  static value: U256;
}
