// @ts-nocheck
@Contract
export class AdminRegistry {
  // static admin: Address;

  // constructor(initialAdminHex: string) {
  //   const tmp = AddressFactory.fromString(initialAdminHex);
  //   AdminRegistry.admin = tmp;
  // }

  static value: U256;

  constructor(initialValue: U256) {
    const tmp = U256Factory.fromString(initialValue);
    AdminRegistry.value = tmp;
  }

  // @External
  // static setAdmin(newAdminHex: string): void {
  //   const candidate = AddressFactory.fromString(newAdminHex);
  //   AdminRegistry.admin = candidate;
  // }

  // @External
  // static resetAdmin(): void {
  //   AdminRegistry.admin = AddressFactory.create();
  // }

  // @View
  // static getAdmin(): string {
  //   return AdminRegistry.admin.toString();
  // }
  @View
  static getValue(): U256 {
    return AdminRegistry.value;
  }

  // @View
  // static isAdmin(addrHex: string): bool {
  //   const addr = AddressFactory.fromString(addrHex);
  //   return AdminRegistry.admin.equals(addr);
  // }

  // @View
  // static adminIsZero(): bool {
  //   return AdminRegistry.admin.isZero();
  // }
}




// export function deploy(): void {

//   store_counter(U256.create());
// }
