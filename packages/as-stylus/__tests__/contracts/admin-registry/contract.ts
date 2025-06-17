// @ts-nocheck
@Contract
export class AdminRegistry {
  static admin: Address;

  constructor(initialAdminHex: Address) {
    admin = initialAdminHex;
  }

  @External
  static setAdmin(newAdminHex: Address): void {
    const candidate = AddressFactory.fromString(newAdminHex);
    admin = candidate;
  }

  @External
  static resetAdmin(): void {
    admin = AddressFactory.create();
  }

  @View
  static getAdmin(): Address {
    return admin;
  }

  @View
  static isAdmin(addrHex: Address): boolean {
    const address = admin;
    const result = address.equals(addrHex);
    return result;
  }

  @View
  static adminIsZero(): boolean {
    const address = admin;
    const result = address.isZero();
    return result;
  }
}
