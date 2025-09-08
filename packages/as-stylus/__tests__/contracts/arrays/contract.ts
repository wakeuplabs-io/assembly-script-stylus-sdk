// @ts-nocheck
@Contract
export class Arrays {
  staticU256Array: U256[3];
  dynamicU256Array: U256[];

  constructor(size: U256) {
    const a = U256Factory.fromString("1");
    const b = U256Factory.fromString("2");
    const c = U256Factory.fromString("3");
    this.staticU256Array = U256ArrayFactory.create([a, b, c]);

    this.dynamicU256Array = [];
    let count = U256Factory.create();
    const one = U256Factory.fromString("1");
    while (count < size) {
      this.dynamicU256Array.push(U256Factory.fromString(count.toString()));
      count = count.add(one);
    }
  }

  @View
  getStaticAt(index: U256): U256 {
    return this.staticU256Array[index.toI32()];
  }

  @External
  setStaticAt(index: U256, value: U256): void {
    this.staticU256Array[index.toI32()] = value;
  }

  @View
  staticLength(): U256 {
    return U256Factory.fromString("3");
  }

  @View
  getDynamicAt(index: U256): U256 {
    return this.dynamicU256Array[index.toI32()];
  }

  @External
  setDynamicAt(index: U256, value: U256): void {
    this.dynamicU256Array[index.toI32()] = value;
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
    return U256Factory.fromString(this.dynamicU256Array.length.toString());
  }

  @View
  getDynamicArray(): U256[] {
    return this.dynamicU256Array;
  }

  @View
  makeMemoryArray(size: U256): U256[] {
    const arr = U256ArrayFactory.create(size);
    let i = U256Factory.create();
    const one = U256Factory.fromString("1");
    while (i < size) {
      arr[i.toI32()] = U256Factory.fromString((i.toI32() + 1).toString());
      i = i.add(one);
    }
    return arr;
  }

  @View
  makeFixedMemoryArray(): U256[] {
    const arr = U256ArrayFactory.memory(3);
    arr[0] = U256Factory.fromString("11");
    arr[1] = U256Factory.fromString("22");
    arr[2] = U256Factory.fromString("33");
    return arr;
  }

  @External
  sumCalldata(values: U256[]): U256 {
    let acc = U256Factory.fromString("0");
    let i = U256Factory.create();
    const one = U256Factory.fromString("1");
    const length = U256Factory.fromString(values.length.toString());
    while (i < length) {
      acc = acc.add(values[i.toI32()]);
      i = i.add(one);
    }
    return acc;
  }

  @External
  lenCalldata(values: U256[]): U256 {
    return U256Factory.fromString(values.length.toString());
  }

  @External
  echoCalldata(values: U256[]): U256[] {
    const length = U256Factory.fromString(values.length.toString());
    const out = U256ArrayFactory.memory(values.length);
    let index = U256Factory.create();
    const one = U256Factory.fromString("1");
    while (index < length) {
      out[index] = values[index];
      index = index.add(one);
    }
    return out;
  }
}
