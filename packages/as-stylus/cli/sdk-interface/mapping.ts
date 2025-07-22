export class Mapping<K, V> {
  get(_key: K): V {
    throw new Error("Not implemented");
  }

  set(_key: K, _value: V): void {
    throw new Error("Not implemented");
  }
}
