import {
  Address,
  Contract,
  ErrorFactory,
  EventFactory,
  External,
  Internal,
  Mapping,
  U256,
  U256Factory,
  View,
  msg,
} from "@wakeuplabs/as-stylus";

const AccessControlInvalidAccount = ErrorFactory.create<[account: Address]>();
const AccessControlInvalidRole = ErrorFactory.create<[role: U256]>();
const AccessControlMissingRole = ErrorFactory.create<[role: U256, account: Address]>();

const RoleGranted = EventFactory.create<[role: U256, account: Address, sender: Address]>({
  indexed: [true, true, true],
});

const RoleRevoked = EventFactory.create<[role: U256, account: Address, sender: Address]>({
  indexed: [true, true, true],
});

const ROLE_ADMIN = U256Factory.fromString("1");
const ROLE_OPERATOR = U256Factory.fromString("2");

@Contract
export class AccessControl {
  admins: Mapping<Address, boolean> = new Mapping<Address, boolean>();
  operators: Mapping<Address, boolean> = new Mapping<Address, boolean>();

  constructor() {
    this.admins.set(msg.sender, true);
    RoleGranted.emit(ROLE_ADMIN, msg.sender, msg.sender);
  }

  @Internal
  requireAdmin(account: Address): void {
    if (!this.admins.get(account)) {
      AccessControlMissingRole.revert(ROLE_ADMIN, account);
    }
  }

  @Internal
  ensureValidRole(role: U256): void {
    if (!role.equals(ROLE_ADMIN) && !role.equals(ROLE_OPERATOR)) {
      AccessControlInvalidRole.revert(role);
    }
  }

  @Internal
  ensureValidAccount(account: Address): void {
    if (account.isZero()) {
      AccessControlInvalidAccount.revert(account);
    }
  }

  @Internal
  setRoleAdmin(role: U256, account: Address, value: boolean): void {
    const previouslyGranted = this.admins.get(account);

    if (previouslyGranted === value) {
      return;
    }

    this.admins.set(account, value);

    if (value) {
      RoleGranted.emit(role, account, msg.sender);
      return;
    }

    RoleRevoked.emit(role, account, msg.sender);
  }

  @Internal
  setRoleOperator(role: U256, account: Address, value: boolean): void {
    const previouslyGranted = this.operators.get(account);

    if (previouslyGranted === value) {
      return;
    }

    this.operators.set(account, value);

    if (value) {
      RoleGranted.emit(role, account, msg.sender);
      return;
    }

    RoleRevoked.emit(role, account, msg.sender);
  }

  @External
  grantRole(role: U256, account: Address): void {
    this.requireAdmin(msg.sender);
    this.ensureValidRole(role);
    this.ensureValidAccount(account);

    if (role.equals(ROLE_ADMIN)) {
      this.setRoleAdmin(role, account, true);
      return;
    }

    if (role.equals(ROLE_OPERATOR)) {
      this.setRoleOperator(role, account, true);
      return;
    }
  }

  @External
  revokeRole(role: U256, account: Address): void {
    this.requireAdmin(msg.sender);
    this.ensureValidRole(role);
    this.ensureValidAccount(account);

    if (role.equals(ROLE_ADMIN)) {
      this.setRoleAdmin(role, account, false);
      return;
    }

    if (role.equals(ROLE_OPERATOR)) {
      this.setRoleOperator(role, account, false);
      return;
    }
  }

  @View
  isAdmin(account: Address): boolean {
    return this.admins.get(account);
  }

  @View
  isOperator(account: Address): boolean {
    return this.operators.get(account);
  }
}
