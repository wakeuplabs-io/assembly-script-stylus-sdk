# ERC20 Performance Benchmark — AssemblyScript (Stylus) vs Solidity

## Overview

This benchmark compares two **ERC-20 token contract implementations** — one written in **Solidity**, and the other using **AssemblyScript (Stylus)**.
Both implementations were tested for **deployment** and the **`mint()`** operation to analyze:

- Gas efficiency
- Execution speed (ms)
- size

**Test Environment**

- Node.js: `v22.14.0`
- Platform: `macOS ARM64`
- Frameworks: Hardhat + Viem (Solidity) | AS Stylus + Viem (Stylus)

---

## Summary Table

| **Metric**                   | **Solidity** | **AssemblyScript (Stylus)** | **Δ Difference (Stylus vs Solidity)** |
| :--------------------------- | :----------: | :-------------------------: | :-----------------------------------: |
| **Deployment time (ms)**     |     1709     |            5197             |           **+204% slower**            |
| **Deployment size (bytes)**  |     5048     |            2333             |          **−53.8% smaller**           |
| **Deployment gas used**      |   930,744    |           557,680           |          **−40.1% cheaper**           |
| **Mint gas used**            |    69,055    |           81,111            |           **+17.5% higher**           |
| **Mint execution time (ms)** |     1453     |            1080             |           **−25.7% faster**           |

---

## Highlights

- **Deployment speed:** Stylus is ~204% slower (5197 ms vs 1709 ms).
- **Deployment size:** Stylus is ~53.8% smaller (2333 B vs 5048 B).
- **Deployment gas:** Stylus uses ~40.1% less gas (557,680 vs 930,744).
- **Mint gas:** Stylus uses ~17.5% more gas (81,111 vs 69,055).
- **Mint speed:** Stylus executes ~26% faster (1080 ms vs 1453 ms).

---

## Interpretation

### Deployment Phase

- **Stylus** achieves **significant savings in gas and byte size**, deploying 40% cheaper and 54% smaller.
- The trade-off is **longer deployment time (+204%)**, likely due to WASM initialization and linking overhead.
- Additionally, there is an extra overhead from executing the deployment command (cargo) through a TypeScript layer, which can add several seconds compared to Solidity, where Viem interacts directly with the EVM deployment pipeline.
- These results suggest that **Stylus optimizes cost at the bytecode level** but introduces extra setup during deployment.

### Mint Operation

- **Stylus executes faster (−25.7%)**, showing **efficient WASM runtime performance**.
- However, gas usage is **~17.5% higher**, reflecting the **current gas accounting model for WASM instructions** on Stylus.

---

## Results Summary

| **Category**            | **Best Performer** | **Analysis**                     |
| :---------------------- | :----------------- | :------------------------------- |
| **Deployment gas**      | 🟢 **Stylus**      | 40% less gas used on deployment  |
| **Deployment size**     | 🟢 **Stylus**      | 54% smaller binary size          |
| **Deployment speed**    | 🔵 **Solidity**    | Much faster (1709 ms vs 5197 ms) |
| **Mint runtime speed**  | 🟢 **Stylus**      | 26% faster execution             |
| **Mint gas efficiency** | 🔵 **Solidity**    | 18% less gas consumption         |

---

## Conclusions

For this **ERC-20 contract**,

- **Stylus** delivers **smaller size** and **lower deployment gas**, with **faster runtime execution**.
- **Solidity** remains **more gas-efficient** for state-changing operations and **faster to deploy**.

While not all results surpass Solidity, they remain very close.
It is important to note that the AssemblyScript code has not yet undergone any optimization phase, which supports the hypothesis that performance and efficiency could be significantly improved with targeted compiler and runtime optimizations.

---

## 7. Recommendations & Next Steps

- Benchmark additional ERC-20 functions (`transfer`, `approve`, `transferFrom`) to assess full contract lifecycle performance and other contract implementations.
- Test **event-heavy operations** (batch mint, multiple logs) to evaluate gas impact of logging.
- Validate results on **Arbitrum Stylus mainnet** to observe real-world L2 gas pricing.
- Monitor **Stylus compiler and runtime updates** for improved WASM gas cost modeling.
- Add a third case using rust SDK

While not all results surpass Solidity, they remain very close.
It is important to note that the AssemblyScript code has not yet undergone any optimization phase, which supports the hypothesis that performance and efficiency could be significantly improved with targeted compiler and runtime optimizations.
