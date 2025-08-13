import { Contract, External, Str, StrFactory, U256, View } from "as-stylus";

@Contract
export class StringStorage {
  storageVal: Str;

  constructor() {
    this.storageVal = StrFactory.fromString("");
  }

  @External
  setStorage(value: string): void {
    const s = StrFactory.fromString(value);
    this.storageVal = s;
  }

  @View
  getStorage(): Str {
    return this.storageVal;
  }

  @View
  substring(offset: U256, length: U256): Str {
    const substring = this.storageVal.slice(offset, length);
    return substring;
  }
}
