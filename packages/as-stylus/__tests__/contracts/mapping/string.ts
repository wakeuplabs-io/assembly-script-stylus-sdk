import { Address, Contract, External, I256, Mapping, U256, View } from "@wakeuplabs/as-stylus";

@Contract
export class MappingString {
  ids: Mapping<string, I256> = new Mapping<string, I256>();
  balances: Mapping<string, U256> = new Mapping<string, U256>();
  enabled: Mapping<string, boolean> = new Mapping<string, boolean>();
  otherAddress: Mapping<string, Address> = new Mapping<string, Address>();
  otherString: Mapping<string, string> = new Mapping<string, string>();

  constructor() {}

  @External
  set(
    key: string,
    value: U256,
    enabledValue: boolean,
    _otherAddress: Address,
    _id: I256,
    _otherString: string,
  ): void {
    this.ids.set(key, _id);
    this.enabled.set(key, enabledValue);
    this.balances.set(key, value);
    this.otherAddress.set(key, _otherAddress);
    this.otherString.set(key, _otherString);
  }

  @External
  getEnabled(key: string): boolean {
    return this.enabled.get(key);
  }

  @View
  getBalance(key: string): U256 {
    return this.balances.get(key);
  }

  @View
  getOtherAddress(_key: string): Address {
    return this.otherAddress.get(_key);
  }

  @View
  getIds(_key: string): I256 {
    return this.ids.get(_key);
  }

  @View
  getOtherString(_key: string): string {
    return this.otherString.get(_key);
  }
}
