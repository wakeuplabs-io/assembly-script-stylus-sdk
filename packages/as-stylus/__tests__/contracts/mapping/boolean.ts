import { Address, Contract, External, I256, Mapping, U256, View } from "@wakeuplabs/as-stylus";

@Contract
export class MappingBoolean {
  ids: Mapping<boolean, I256> = new Mapping<boolean, I256>();
  balances: Mapping<boolean, U256> = new Mapping<boolean, U256>();
  enabled: Mapping<boolean, boolean> = new Mapping<boolean, boolean>();
  otherAddress: Mapping<boolean, Address> = new Mapping<boolean, Address>();
  names: Mapping<boolean, string> = new Mapping<boolean, string>();

  constructor() {}

  @External
  set(
    key: boolean,
    value: U256,
    enabledValue: boolean,
    address: Address,
    id: I256,
    name: string,
  ): void {
    this.ids.set(key, id);
    this.enabled.set(key, enabledValue);
    this.balances.set(key, value);
    this.otherAddress.set(key, address);
    this.names.set(key, name);
  }

  @External
  getEnabled(key: boolean): boolean {
    return this.enabled.get(key);
  }

  @View
  getBalance(key: boolean): U256 {
    return this.balances.get(key);
  }

  @View
  getOtherAddress(_key: boolean): Address {
    return this.otherAddress.get(_key);
  }

  @View
  getIds(_key: boolean): I256 {
    return this.ids.get(_key);
  }

  @View
  getBooleanName(_key: boolean): string {
    return this.names.get(_key);
  }
}
