import { Contract, External, View, U256, U256Factory } from "@wakeuplabs/as-stylus";

@Contract
export class Arrays {
  staticU256Array: U256[3];
  dynamicU256Array: U256[];

  constructor(size: U256) {
    const a = U256Factory.fromString("1");
    const b = U256Factory.fromString("2");
    const c = U256Factory.fromString("3");
    this.staticU256Array = StaticArrayFactory.create<U256>([a, b, c]);

    this.dynamicU256Array = DynamicArrayFactory.empty<U256>();
    let count = U256Factory.create();
    const one = U256Factory.fromString("1");
    while (count < size) {
      this.dynamicU256Array.push(count);
      count = count.add(one);
    }
  }

  @View
  getStaticAt(index: U256): U256 {
    return this.staticU256Array[index];
  }

  @External
  setStaticAt(index: U256, value: U256): void {
    this.staticU256Array[index] = value;
  }

  @View
  staticLength(): U256 {
    return this.staticU256Array.length();
  }

  @View
  getDynamicAt(index: U256): U256 {
    return this.dynamicU256Array[index];
  }

  @External
  setDynamicAt(index: U256, value: U256): void {
    this.dynamicU256Array[index] = value;
  }

  @External
  pushDynamic(value: U256): void {
    this.dynamicU256Array.push(value);
  }

  @External
  popDynamic(): void {
    this.dynamicU256Array.pop();
  }

  @View
  dynamicLength(): U256 {
    return this.dynamicU256Array.length();
  }

  @View
  getDynamicArray(): U256[] {
    return this.dynamicU256Array;
  }

  @View
  makeMemoryArray(size: U256): U256[] {
    const arr = MemoryArrayFactory.ofLength<U256>(size);
    let i = U256Factory.create();
    const one = U256Factory.fromString("1");
    while (i < size) {
      arr[i] = i.add(one);
      i = i.add(one);
    }
    return arr;
  }

  @View
  makeFixedMemoryArray(): U256[] {
    const arr = MemoryArrayFactory.ofLength<U256>(U256Factory.fromString("3"));
    arr[U256Factory.fromString("0")] = U256Factory.fromString("11");
    arr[U256Factory.fromString("1")] = U256Factory.fromString("22");
    arr[U256Factory.fromString("2")] = U256Factory.fromString("33");
    return arr;
  }

  @External
  sumCalldata(values: U256[]): U256 {
    let acc = U256Factory.create();
    let i = U256Factory.create();
    const one = U256Factory.fromString("1");
    const len = values.length();
    while (i < len) {
      const value = values[i];
      acc = acc.add(value);
      i = i.add(one);
    }
    return acc;
  }

  @External
  lenCalldata(values: U256[]): U256 {
    return values.length();
  }

  @External
  echoCalldata(values: U256[]): U256[] {
    const out = MemoryArrayFactory.ofLength<U256>(values.length());
    let index = U256Factory.create();
    const one = U256Factory.fromString("1");
    const len = values.length();
    while (index < len) {
      out[index] = values[index];
      index = index.add(one);
    }
    return out;
  }
}
