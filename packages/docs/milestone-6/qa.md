# Stylus SDK QA

This document evaluates how easily new developers can get started with the language. It focuses on assessing the clarity of the documentation, the quality of the CLI feedback, and the current limitations of the language.

## Documentation Issues

### Documentation Gaps

- Missing **pre-requisites** in the documentation — they are only listed in the [Playground](https://as-stylus-playground.wakeuplabs.link/).
- [Structs page](https://as-stylus.wakeuplabs.io/structures/struct): unclear instantiation.  
  It’s ambiguous whether to use `new` or `StructFactory.create`.  
  Also, a missing `@Struct` decorator or similar reference may be required.
- Missing documentation for:
  - **Inheritance**
  - **`msg` object**
- [Structs parameters](https://as-stylus.wakeuplabs.io/structures/struct) are incorrectly shown as arrays instead of JSON objects.
- [External decorators page](https://as-stylus.wakeuplabs.io/decorators/external): outdated — currently says methods must be `static`, which is no longer necessary.

---

## Future Possible Implementations & Known Limitations

Although there are many features out of scopes, after this QA stage we detect some missing complex structure support is missing and they will add

- Arrays (basic types) — required to return or handle data.
- `Mapping<U256, boolean>` → not working.
- Ternary conditionals (`a === b ? true : false`) → not supported.
- `Mapping<U256, String>` → not working.
- Linter — to block invalid TypeScript/AssemblyScript.
- Automatically install **Cargo** during SDK setup (if not present).
- When running `npx @wakeuplabs/as-stylus generate my-contract`,  
  the project is created successfully, but **no test file** is included — should add a minimal test template.
- Support for **custom global type overrides**, e.g.: types like string and Date. In that way, our language will be closer than Typescript.
- Enable **mappings of Structs**.
- Enable **enums**.
- Allow use of **Date** as equivalent to timestamp.
- Add **cross-contract calls**.
- Allow **contract instantiation and deployment** within another contract.
- Support **constants declared outside the main contract**.
- Add **smaller integer types** (e.g., `U32`).
- Create a **Stylus VS Code extension** (or CLI feature) to run tests without a separate node — similar to Hardhat.

---
