export class Mapping2<K1, K2, V> {
  get(_key1: K1, _key2: K2): V {
    throw new Error("Not implemented");
  }

  set(_key1: K1, _key2: K2, _value: V): void {
    throw new Error("Not implemented");
  }
}
