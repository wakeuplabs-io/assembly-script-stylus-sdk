import { Contract, ErrorFactory, External, U256, U256Factory, View } from "@wakeuplabs/as-stylus";

const ReentrancyGuardReentrant = ErrorFactory.create<[]>();

@Contract
export class ReentrancyGuard {
  value: U256;
  locked: boolean;

  constructor() {
    this.locked = false;
    this.value = U256Factory.fromString("1");
  }

  @External
  enter(): void {
    if (this.locked) {
      ReentrancyGuardReentrant.revert();
    }
    this.locked = true;
  }

  @View
  isLocked(): boolean {
    return this.locked;
  }

  @External
  whenNotLocked(): void {
    if (this.locked) {
      ReentrancyGuardReentrant.revert();
    }
  }

  @External
  exit(): void {
    this.locked = false;
  }

  @External
  add(): void {
    this.whenNotLocked();
    const delta = U256Factory.fromString("1");
    this.enter();
    this.value = this.value.addUnchecked(delta);
    this.exit();
  }
}
