class ErrorFactory {
  static create<const A extends unknown[]>() {
    return class {
      static revert(..._args: A): never {
        throw new Error(`not implemented`);
      }
    } as unknown as { revert(...args: A): never };
  }
}

export { ErrorFactory };
