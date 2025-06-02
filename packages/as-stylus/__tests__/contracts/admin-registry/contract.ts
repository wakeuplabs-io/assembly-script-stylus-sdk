// @ts-nocheck
@Contract
export class AdminRegistry {
  static admin: Address;

  constructor(initialAdminHex: string) {
    const tmp = AddressFactory.fromString(initialAdminHex);
    AdminRegistry.admin = tmp;
  }

  @External
  static setAdmin(newAdminHex: string): void {
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
  static isAdmin(addrHex: string): bool {
    const addr = AddressFactory.fromString(addrHex);
    return AdminRegistry.admin.equals(addr);
  }

  // @View
  // static adminIsZero(): bool {
  //   return AdminRegistry.admin.isZero();
  // }
}
