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
  - **Events**
  - **Errors**
  - **Sending Ethers**
- [Structs parameters](https://as-stylus.wakeuplabs.io/structures/struct) are incorrectly shown as arrays instead of JSON objects.
- [External decorators page](https://as-stylus.wakeuplabs.io/decorators/external): outdated — currently says methods must be `static`, which is no longer necessary.

### Documentation Improvements

Following the identification of the above documentation gaps, comprehensive improvements were implemented to address these inconsistencies:

- **Pre-requisites**: Added a dedicated prerequisites section to the main documentation, clearly listing all required dependencies and setup steps.
- **Structs Documentation**: Updated the structs page with clear instantiation examples, clarifying the use of `StructFactory.create` and proper decorator usage.
- **New Documentation Pages**: Created complete documentation for:
  - **Inheritance**: Detailed guide on class inheritance patterns and best practices.
  - **Events**: Comprehensive documentation on event declaration and emission.
  - **Errors**: Guide for error handling and custom error types.
  - **Sending Ethers**: Instructions for native token transfers and value handling.
- **Struct Parameters**: Corrected the struct parameters documentation to properly show JSON object syntax instead of arrays.
- **External Decorators**: Updated the external decorators page to reflect current requirements, removing outdated information about `static` methods.

These improvements ensure that new developers have accurate, comprehensive documentation to get started with the SDK effectively.

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

---
