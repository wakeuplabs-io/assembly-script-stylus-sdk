import { Address, AddressFactory, Contract, External, View } from "as-stylus";

@Contract
export class AdminRegistry {
  admin: Address;

  constructor(initialAdminHex: Address) {
    this.admin = initialAdminHex;
  }

  @External
  setAdmin(newAdminHex: Address): void {
    this.admin = newAdminHex;
  }

  @External
  resetAdmin(): void {
    this.admin = AddressFactory.create();
  }

  @View
  getAdmin(): Address {
    return this.admin;
  }

  @View
  isAdmin(addrHex: Address): boolean {
    const adminAddress = this.admin;
    const result = adminAddress.equals(addrHex);
    return result;
  }

  @View
  adminIsZero(): boolean {
    const address = this.admin;
    const result = address.isZero();
    return result;
  }
}
