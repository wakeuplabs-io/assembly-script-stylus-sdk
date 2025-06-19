// @ts-nocheck
@Contract
export class AdminRegistry {
  static admin: Address;

  constructor(initialAdminHex: Address) {
    AdminRegistry.admin = initialAdminHex;
  }

  @External
  static setAdmin(newAdminHex: Address): void {
    AdminRegistry.admin = newAdminHex;
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
    const adminAddress = AdminRegistry.admin;
    const result = adminAddress.equals(addrHex);
    return result;
  }

  @View
  static adminIsZero(): boolean {
    const address = AdminRegistry.admin;
    const result = address.isZero();
    return result;
  }
}
