// @ts-nocheck
@Contract
export class AdminRegistry {
  static admin: Address;

  constructor(initialAdminHex: Address) {
    AdminRegistry.admin = initialAdminHex;
  }

  @External
  static setAdmin(newAdminHex: Address): void {
    const candidate = AddressFactory.fromString(newAdminHex);
    AdminRegistry.admin = candidate;
  }

  @External
  static resetAdmin(): void {
    AdminRegistry.admin = AddressFactory.create();
  }

  @View
  static getAdmin(): Address {
    return AdminRegistry.admin;
  }

  @View
  static isAdmin(addrHex: Address): boolean {
    const address = AdminRegistry.admin;
    const result = address.equals(addrHex);
    return result;
  }

  @View
  static adminIsZero(): boolean {
    const address = AdminRegistry.admin;
    const result = address.isZero();
    return result;
  }
}
