/**
 * A generic Struct type to instantiate struct values into a contract.
 */
export type Struct<T> = T;

/**
 * Utility class for creating Struct instances.
 * Usage: StructFactory.create<StructType>({ field1: value1, field2: value2, ... })
 */
export declare class StructFactory {
  static create<T>(values: { [K in keyof T]: T[K] }): T;
}
