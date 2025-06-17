// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

@Contract
export class StringStorage {
  static storageVal: Str;

  @External
  static setStorage(value: string): void {
    const s = StrFactory.fromString(value);
    storageVal = s;
  }

  @View
  static getStorage(): string {
    return storageVal;
  }

  static substring(offset: U256, length: U256): string {
    const substring = storageVal.slice(offset, length);
    return substring;
  }
}
