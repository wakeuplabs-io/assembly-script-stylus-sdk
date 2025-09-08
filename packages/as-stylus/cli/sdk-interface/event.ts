type AnyTuple = readonly unknown[];

type IndexedMask<T extends AnyTuple> = { [K in keyof T]: boolean } & { length: T["length"] };

/**
 * Factory for creating events
 * @param cfg - Configuration object
 * @param cfg.name - Name of the event
 * @param cfg.indexed - Indexed mask
 * @returns Event class
 */
export class EventFactory {
  static create<T extends AnyTuple>(cfg: { indexed: IndexedMask<T> }) {
    const { indexed } = cfg;

    return class {
      static readonly indexed: IndexedMask<T> = indexed;

      static emit(..._args: T): void {
        throw new Error("Not implemented");
      }
    };
  }
}
