import { AbiType } from "@/cli/types/abi.types.js";

type SlotAssignment = {
  type: AbiType;
  dynamicType?: string;
  length?: number;
};

/**
 * SlotManager is responsible for managing storage slots and assigning them to storage variables.
 * This class has a single responsibility: managing the allocation and tracking of storage slots.
 */
export class SlotManager {
  private nextAvailableSlot: number = 0;
  private allocatedSlots: Set<number> = new Set();
  private variableSlotMap: Map<string, number> = new Map();
  private slotVariableMap: Map<number, string> = new Map();

  constructor(startSlot: number = 0) {
    this.nextAvailableSlot = startSlot;
  }

  /**
   * Allocates a new slot for a storage variable
   * @param variableName - The name of the storage variable
   * @param variable - The storage variable to allocate a slot for
   * @returns The allocated slot number
   */
  public allocateSlot(variableName: string, slotAssignment: SlotAssignment): number {
    if (this.variableSlotMap.has(variableName)) {
      throw new Error(`Variable '${variableName}' already has an allocated slot`);
    }

    const slot = this.findNextAvailableSlot(slotAssignment);
    this.allocateSlotRange(slot, this.calculateSlotCount(slotAssignment));

    this.variableSlotMap.set(variableName, slot);
    this.slotVariableMap.set(slot, variableName);

    return slot;
  }

  /**
   * Gets the slot allocated for a specific variable
   * @param variableName - The name of the variable
   * @returns The allocated slot number
   */
  public getSlotForVariable(variableName: string): number {
    const slot = this.variableSlotMap.get(variableName);

    if (!slot && slot !== 0) {
      throw new Error(`Variable '${variableName}' has no allocated slot`);
    }

    return slot;
  }

  /**
   * Gets the variable name allocated to a specific slot
   * @param slot - The slot number
   * @returns The variable name, or undefined if not found
   */
  public getVariableForSlot(slot: number): string | undefined {
    return this.slotVariableMap.get(slot);
  }

  /**
   * Checks if a slot is allocated
   * @param slot - The slot number to check
   * @returns True if the slot is allocated, false otherwise
   */
  public isSlotAllocated(slot: number): boolean {
    return this.allocatedSlots.has(slot);
  }

  /**
   * Gets all allocated slots
   * @returns A set of all allocated slot numbers
   */
  public getAllocatedSlots(): Set<number> {
    return new Set(this.allocatedSlots);
  }

  /**
   * Gets all variable-slot mappings
   * @returns A map of variable names to their allocated slots
   */
  public getVariableSlotMap(): Map<string, number> {
    return new Map(this.variableSlotMap);
  }

  /**
   * Resets the slot manager to start from a new base slot
   * @param startSlot - The new starting slot number
   */
  public reset(startSlot: number = 0): void {
    this.nextAvailableSlot = startSlot;
    this.allocatedSlots.clear();
    this.variableSlotMap.clear();
    this.slotVariableMap.clear();
  }

  /**
   * Gets the next available slot number
   * @returns The next available slot number
   */
  public getNextAvailableSlot(): number {
    return this.nextAvailableSlot;
  }

  /**
   * Calculates the total number of slots needed for a storage variable
   * @param variable - The storage variable
   * @returns The number of slots needed
   */
  private calculateSlotCount(variable: SlotAssignment): number {
    switch (variable.type) {
      case AbiType.ArrayStatic:
        return variable.length || 1;
      case AbiType.Mapping:
        return 1;
      case AbiType.MappingNested:
        return 1;
      default:
        return 1;
    }
  }

  /**
   * Finds the next available slot that can accommodate the variable
   * @param variable - The storage variable
   * @returns The next available slot number
   */
  private findNextAvailableSlot(variable: SlotAssignment): number {
    const slotCount = this.calculateSlotCount(variable);
    let startSlot = this.nextAvailableSlot;
    let found = false;
    while (!found) {
      for (let i = 0; i < slotCount; i++) {
        if (!this.allocatedSlots.has(startSlot + i)) {
          found = true;
          break;
        }
      }

      if (found) {
        return startSlot;
      }

      startSlot++;
    }

    return startSlot;
  }

  /**
   * Allocates a range of slots
   * @param startSlot - The starting slot number
   * @param slotCount - The number of slots to allocate
   */
  private allocateSlotRange(startSlot: number, slotCount: number): void {
    for (let i = 0; i < slotCount; i++) {
      this.allocatedSlots.add(startSlot + i);
    }
    if (startSlot + slotCount > this.nextAvailableSlot) {
      this.nextAvailableSlot = startSlot + slotCount;
    }
  }

  /**
   * Generates slot constants for all allocated slots
   * @returns Array of slot constant declarations
   */
  public generateSlotConstants(): string[] {
    const constants: string[] = [];
    const sortedSlots = Array.from(this.allocatedSlots).sort((a, b) => a - b);
    for (const slot of sortedSlots) {
      const slotNumber = slot.toString(16).padStart(2, "0");
      constants.push(`const __SLOT${slotNumber}: u64 = ${slot};`);
    }
    return constants;
  }
}
