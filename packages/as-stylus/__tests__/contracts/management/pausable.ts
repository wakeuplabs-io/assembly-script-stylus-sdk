import { Contract, ErrorFactory, External, U256Factory, View } from "@wakeuplabs/as-stylus";

const ContractPaused = ErrorFactory.create<[]>();

@Contract
export class Pausable {
  paused: boolean;

  constructor() {
    this.paused = false;
  }

  @External
  pause(): void {
    this.paused = true;
  }

  @External
  unpause(): void {
    this.paused = false;
  }

  @View
  isPaused(): boolean {
    return this.paused;
  }

  @View
  whenNotPause() {
    if (this.paused) {
      ContractPaused.revert();
    }
  }

  @View
  getValue() {
    this.whenNotPause();

    return U256Factory.fromString("1");
  }
}
