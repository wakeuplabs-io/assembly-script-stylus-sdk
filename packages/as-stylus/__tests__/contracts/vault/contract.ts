/* eslint-disable no-global-assign */
// @ts-nocheck

// ERC-4626 Custom Errors (following OpenZeppelin standard)
@Error
class ERC4626ExceededMaxDeposit {
  receiver: Address;
  assets: U256;
  max: U256;
}

@Error
class ERC4626ExceededMaxMint {
  receiver: Address;
  shares: U256;
  max: U256;
}

@Error
class ERC4626ExceededMaxWithdraw {
  owner: Address;
  assets: U256;
  max: U256;
}

@Error
class ERC4626ExceededMaxRedeem {
  owner: Address;
  shares: U256;
  max: U256;
}

@Error
class ERC4626ZeroAddress {
  addr: Address;
}

@Error
class ERC4626ZeroAmount {
  amount: U256;
}

// ERC-20 Events (inherited)
@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  value: U256;
}

@Event
export class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  value: U256;
}

// ERC-4626 Specific Events
@Event
export class Deposit {
  @Indexed sender: Address;
  @Indexed owner: Address;
  assets: U256;
  shares: U256;
}

@Event
export class Withdraw {
  @Indexed sender: Address;
  @Indexed receiver: Address;
  @Indexed owner: Address;
  assets: U256;
  shares: U256;
}

@Contract
export class ERC4626Vault {
  // ERC-20 State (shares as tokens)
  static balances: Mapping<Address, U256>;
  static allowances: MappingNested<Address, Address, U256>;
  static totalSupply: U256;
  static name: Str;
  static symbol: Str;
  static decimals: U256;

  // ERC-4626 State
  static asset: Address; // underlying token address
  static totalAssets: U256; // total assets under management

  constructor(_asset: string, _name: string, _symbol: string) {
    // Initialize asset
    asset = AddressFactory.fromString(_asset);
    name = StrFactory.fromString(_name);
    symbol = StrFactory.fromString(_symbol);

    // Initialize values
    totalAssets = U256Factory.fromString("0");
    totalSupply = U256Factory.fromString("0");
    decimals = U256Factory.fromString("18"); // Default, should match asset decimals
  }

  // ============================================
  // ERC-20 Metadata
  // ============================================

  @View
  static name(): Str {
    return name;
  }

  @View
  static symbol(): Str {
    return symbol;
  }

  @View
  static decimals(): U256 {
    return decimals;
  }

  @View
  static totalSupply(): U256 {
    return totalSupply;
  }

  @View
  static balanceOf(account: Address): U256 {
    return balances.get(account);
  }

  // ============================================
  // ERC-4626 Core Methods
  // ============================================

  @View
  static asset(): Address {
    return asset;
  }

  @View
  static totalAssets(): U256 {
    return totalAssets;
  }

  @View
  static convertToShares(assets: U256): U256 {
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    if (supply.equals(zero)) {
      return assets;
    }
    const multiplied = assets.mul(supply);
    return multiplied.div(totalAssets);
  }

  @View
  static convertToAssets(shares: U256): U256 {
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    if (supply.equals(zero)) {
      return shares;
    }
    const multiplied = shares.mul(totalAssets);
    return multiplied.div(supply);
  }

  // ============================================
  // ERC-4626 Max and Preview Methods
  // ============================================

  @View
  static maxDeposit(_receiver: Address): U256 {
    return U256Factory.fromString(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    );
  }

  @View
  static maxMint(_receiver: Address): U256 {
    return U256Factory.fromString(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    );
  }

  @View
  static maxWithdraw(owner: Address): U256 {
    const balance = balances.get(owner);
    // Inline convertToAssets logic
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    if (supply.equals(zero)) {
      return balance;
    }
    const multiplied = balance.mul(totalAssets);
    return multiplied.div(supply);
  }

  @View
  static maxRedeem(owner: Address): U256 {
    return balances.get(owner);
  }

  @View
  static previewDeposit(assets: U256): U256 {
    // Inline convertToShares logic
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    if (supply.equals(zero)) {
      return assets;
    }
    const multiplied = assets.mul(supply);
    return multiplied.div(totalAssets);
  }

  @View
  static previewMint(shares: U256): U256 {
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    if (supply.equals(zero)) {
      return shares;
    }
    const multiplied = shares.mul(totalAssets);
    const divided = multiplied.div(supply);
    const one = U256Factory.fromString("1");
    return divided.add(one);
  }

  @View
  static previewWithdraw(assets: U256): U256 {
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    if (supply.equals(zero)) {
      return assets;
    }
    const multiplied = assets.mul(supply);
    const divided = multiplied.div(totalAssets);
    const one = U256Factory.fromString("1");
    return divided.add(one);
  }

  @View
  static previewRedeem(shares: U256): U256 {
    // Inline convertToAssets logic
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    if (supply.equals(zero)) {
      return shares;
    }
    const multiplied = shares.mul(totalAssets);
    return multiplied.div(supply);
  }

  // ============================================
  // ERC-4626 Main Operations
  // ============================================

  @External
  static deposit(assets: U256, receiver: Address): U256 {
    // Inline maxDeposit logic
    const maxAssets = U256Factory.fromString("115792089237316195423570985008687907853269984665640564039457584007913129639935");
    if (assets.greaterThan(maxAssets)) {
      ERC4626ExceededMaxDeposit.revert(receiver, assets, maxAssets);
    }

    // Inline previewDeposit logic
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    let shares: U256;
    if (supply.equals(zero)) {
      shares = assets;
    } else {
      const multiplied = assets.mul(supply);
      shares = multiplied.div(totalAssets);
    }
    _depositSafe(msg.sender, receiver, assets, shares);

    return shares;
  }

  @External
  static mint(shares: U256, receiver: Address): U256 {
    // Inline maxMint logic
    const maxShares = U256Factory.fromString("115792089237316195423570985008687907853269984665640564039457584007913129639935");
    if (shares.greaterThan(maxShares)) {
      ERC4626ExceededMaxMint.revert(receiver, shares, maxShares);
    }

    // Inline previewMint logic
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    let assets: U256;
    if (supply.equals(zero)) {
      assets = shares;
    } else {
      const multiplied = shares.mul(totalAssets);
      const divided = multiplied.div(supply);
      const one = U256Factory.fromString("1");
      assets = divided.add(one);
    }
    _depositSafe(msg.sender, receiver, assets, shares);

    return assets;
  }

  @External
  static withdraw(assets: U256, receiver: Address, owner: Address): U256 {
    // Inline maxWithdraw logic
    const balance = balances.get(owner);
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    let maxAssets: U256;
    if (supply.equals(zero)) {
      maxAssets = balance;
    } else {
      const multiplied = balance.mul(totalAssets);
      maxAssets = multiplied.div(supply);
    }
    if (assets.greaterThan(maxAssets)) {
      ERC4626ExceededMaxWithdraw.revert(owner, assets, maxAssets);
    }

    // Inline previewWithdraw logic
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    let shares: U256;
    if (supply.equals(zero)) {
      shares = assets;
    } else {
      const multiplied = assets.mul(supply);
      const divided = multiplied.div(totalAssets);
      const one = U256Factory.fromString("1");
      shares = divided.add(one);
    }
    _withdrawSafe(msg.sender, receiver, owner, assets, shares);

    return shares;
  }

  @External
  static redeem(shares: U256, receiver: Address, owner: Address): U256 {
    // Inline maxRedeem logic
    const maxShares = balances.get(owner);
    if (shares.greaterThan(maxShares)) {
      ERC4626ExceededMaxRedeem.revert(owner, shares, maxShares);
    }

    // Inline previewRedeem logic
    const supply = totalSupply;
    const zero = U256Factory.fromString("0");
    let assets: U256;
    if (supply.equals(zero)) {
      assets = shares;
    } else {
      const multiplied = shares.mul(totalAssets);
      assets = multiplied.div(supply);
    }
    _withdrawSafe(msg.sender, receiver, owner, assets, shares);

    return assets;
  }

  // ============================================
  // ERC-20 Required Methods
  // ============================================

  @External
  static transfer(to: Address, amount: U256): boolean {
    const from = msg.sender;
    _transferSafe(from, to, amount);
    return true;
  }

  @External
  static approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    _approve(owner, spender, amount);
    return true;
  }

  @View
  static allowance(owner: Address, spender: Address): U256 {
    return allowances.get(owner, spender);
  }

  @External
  static transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    _spendAllowance(from, spender, amount);
    _transferSafe(from, to, amount);
    return true;
  }

  // ============================================
  // Internal Helper Functions
  // ============================================

  @Internal
  static _deposit(caller: Address, receiver: Address, assets: U256, shares: U256): void {
    totalAssets = totalAssets.add(assets);
    _mint(receiver, shares);

    Deposit.emit(caller, receiver, assets, shares);
  }

  @Internal
  static _withdraw(
    caller: Address,
    receiver: Address,
    owner: Address,
    assets: U256,
    shares: U256,
  ): void {
    if (!caller.equals(owner)) {
      _spendAllowance(owner, caller, shares);
    }

    _burn(owner, shares);
    totalAssets = totalAssets.sub(assets);

    Withdraw.emit(caller, receiver, owner, assets, shares);
  }

  @Internal
  static _mint(to: Address, amount: U256): void {
    const newTotalSupply = totalSupply.add(amount);
    totalSupply = newTotalSupply;

    const currentBalance = balances.get(to);
    const newBalance = currentBalance.add(amount);
    balances.set(to, newBalance);

    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(zeroAddress, to, amount);
  }

  @Internal
  static _burn(from: Address, amount: U256): void {
    const fromBalance = balances.get(from);
    const newFromBalance = fromBalance.sub(amount);
    balances.set(from, newFromBalance);

    const newTotalSupply = totalSupply.sub(amount);
    totalSupply = newTotalSupply;

    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(from, zeroAddress, amount);
  }

  @Internal
  static _transfer(from: Address, to: Address, amount: U256): void {
    const fromBalance = balances.get(from);
    const newFromBalance = fromBalance.sub(amount);
    balances.set(from, newFromBalance);

    const toBalance = balances.get(to);
    const newToBalance = toBalance.add(amount);
    balances.set(to, newToBalance);

    Transfer.emit(from, to, amount);
  }

  @Internal
  static _approve(owner: Address, spender: Address, amount: U256): void {
    allowances.set(owner, spender, amount);
    Approval.emit(owner, spender, amount);
  }

  @Internal
  static _spendAllowance(owner: Address, spender: Address, amount: U256): void {
    const currentAllowance = allowances.get(owner, spender);
    const maxValue = U256Factory.fromString(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    );

    if (!currentAllowance.equals(maxValue)) {
      const newAllowance = currentAllowance.sub(amount);
      allowances.set(owner, spender, newAllowance);
    }
  }

  // ============================================
  // Security & Edge Case Protections
  // ============================================

  @Internal
  static _requireNonZeroAddress(addr: Address): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    if (addr.equals(zeroAddress)) {
      ERC4626ZeroAddress.revert(addr);
    }
  }

  @Internal
  static _beforeTokenTransfer(_from: Address, _to: Address, _amount: U256): void {
    // Hook for future extensions (deposit/withdraw limits, pausing, etc.)
  }

  @Internal
  static _afterTokenTransfer(_from: Address, _to: Address, _amount: U256): void {
    // Hook for future extensions
  }

  // Override internal functions to add security checks
  @Internal
  static _transferSafe(from: Address, to: Address, amount: U256): void {
    _requireNonZeroAddress(to);
    _beforeTokenTransfer(from, to, amount);
    _transfer(from, to, amount);
    _afterTokenTransfer(from, to, amount);
  }

  @Internal
  static _mintSafe(to: Address, amount: U256): void {
    _requireNonZeroAddress(to);
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    _beforeTokenTransfer(zeroAddress, to, amount);
    _mint(to, amount);
    _afterTokenTransfer(zeroAddress, to, amount);
  }

  @Internal
  static _burnSafe(from: Address, amount: U256): void {
    _requireNonZeroAddress(from);
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    _beforeTokenTransfer(from, zeroAddress, amount);
    _burn(from, amount);
    _afterTokenTransfer(from, zeroAddress, amount);
  }

  // Update main functions to use safe versions
  @Internal
  static _depositSafe(caller: Address, receiver: Address, assets: U256, shares: U256): void {
    _requireNonZeroAddress(receiver);

    // Verify amounts are not zero
    const zero = U256Factory.fromString("0");
    if (assets.equals(zero)) {
      ERC4626ZeroAmount.revert(assets);
    }
    if (shares.equals(zero)) {
      ERC4626ZeroAmount.revert(shares);
    }

    const newTotalAssets = totalAssets.add(assets);
    totalAssets = newTotalAssets;
    _mintSafe(receiver, shares);

    Deposit.emit(caller, receiver, assets, shares);
  }

  @Internal
  static _withdrawSafe(
    caller: Address,
    receiver: Address,
    owner: Address,
    assets: U256,
    shares: U256,
  ): void {
    _requireNonZeroAddress(receiver);
    _requireNonZeroAddress(owner);

    // Verify amounts are not zero
    const zero = U256Factory.fromString("0");
    if (assets.equals(zero)) {
      ERC4626ZeroAmount.revert(assets);
    }
    if (shares.equals(zero)) {
      ERC4626ZeroAmount.revert(shares);
    }

    if (!caller.equals(owner)) {
      _spendAllowance(owner, caller, shares);
    }

    _burnSafe(owner, shares);
    const newTotalAssets = totalAssets.sub(assets);
    totalAssets = newTotalAssets;

    Withdraw.emit(caller, receiver, owner, assets, shares);
  }
}
