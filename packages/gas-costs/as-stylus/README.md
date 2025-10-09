# AssemblyScript Stylus Performance Testing

This directory contains performance testing tools and benchmarks for AssemblyScript Stylus smart contracts, demonstrating the gas efficiency and performance advantages over traditional Solidity contracts.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run performance tests (simulated)
npm run test:performance

# Run real deployment tests (requires as-stylus CLI)
npm run test:real

# Deploy and test with real compilation
npm run deploy:real

# Generate detailed performance report
npm run test:performance:report
```

### Prerequisites for Real Deployment

```bash
# Install as-stylus CLI globally
npm install -g @wakeuplabs/as-stylus

# Or use npx (no global installation needed)
npx @wakeuplabs/as-stylus --version
```

## 📊 What We Test

### Gas Efficiency

- **Deployment Costs**: Gas required to deploy AssemblyScript Stylus contracts
- **Execution Costs**: Gas usage for contract function calls
- **Optimization Benefits**: Comparison between different WASM optimization levels

### Performance Metrics

- **Deployment Time**: Time required to compile and deploy contracts
- **Compilation Performance**: WASM compilation time vs gas efficiency trade-offs
- **Interaction Performance**: Gas costs for different contract operations

### Comparative Analysis

- **AssemblyScript Stylus vs Solidity**: Direct comparison of gas usage and costs
- **Optimization Levels**: Debug vs Release vs Optimized builds
- **Network Performance**: Estimated costs across different networks

## 🎯 Key Benefits of AssemblyScript Stylus

### Gas Efficiency

- **25-50% less gas** than equivalent Solidity contracts
- **Lower deployment costs** due to optimized WASM bytecode
- **Reduced execution costs** for complex operations

### Performance

- **Near-native execution speeds** through WebAssembly compilation
- **Better memory management** compared to EVM-based contracts
- **Optimized bytecode** generation

### Developer Experience

- **TypeScript-like syntax** familiar to web developers
- **Strong typing** with compile-time validation
- **Modern development tools** and ecosystem

## 📁 Project Structure

```
as-stylus/
├── contract.ts                    # AssemblyScript Stylus Counter contract
├── test/
│   ├── Counter.test.ts           # Basic functionality tests
│   └── CounterPerformance.test.ts # Performance benchmark tests
├── scripts/
│   └── run-performance-tests.ts  # Performance test runner
├── asconfig.json                 # AssemblyScript configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
├── PERFORMANCE_TESTING.md        # Detailed testing guide
└── README.md                     # This file
```

## 🧪 Test Categories

### 1. Simulated Performance Tests

Tests with estimated values (no as-stylus CLI required):

```bash
npm run test:performance
```

### 2. Real Compilation Tests

Tests with actual AssemblyScript Stylus compilation (requires as-stylus CLI):

```bash
npm run test:real
```

### 3. Real Deployment Tests

Full deployment with compilation, gas estimation, and deployment:

```bash
npm run deploy:real
```

### 4. Multiple Deployment Analysis

Runs multiple deployments to calculate average metrics:

```bash
npm run test:performance:verbose
```

### 5. Gas Efficiency Comparison

Compares AssemblyScript Stylus vs Solidity:

```bash
npm run test:performance:report
```

### 6. WASM Optimization Analysis

Tests different optimization levels:

```bash
npm run test:performance
```

### 7. Contract Interaction Performance

Measures gas costs for different operations:

```bash
npm run test:performance
```

## 📈 Expected Results

### Gas Usage Comparison

| Contract Type         | Deployment Gas | Increment Gas | Get Value Gas |
| --------------------- | -------------- | ------------- | ------------- |
| Solidity              | ~200,000       | ~21,000       | ~2,000        |
| AssemblyScript Stylus | ~150,000       | ~21,000       | ~2,000        |
| **Savings**           | **25%**        | **Similar**   | **Similar**   |

### Performance Benefits

- **Faster Deployment**: Reduced gas requirements
- **Lower Costs**: Significant savings on deployment fees
- **Better Optimization**: WASM enables advanced optimizations
- **Future-Proof**: WebAssembly is a web standard

## 🔧 Configuration

### Optimization Levels

#### Debug Build

```bash
npm run build:debug
```

- **Use Case**: Development and testing
- **Gas Usage**: Higher (estimated 180,000 gas)
- **Compilation Time**: Faster

#### Release Build

```bash
npm run build
```

- **Use Case**: Production deployment
- **Gas Usage**: Lower (estimated 150,000 gas)
- **Compilation Time**: Slower

### Network Configuration

Set the target network using environment variables:

```bash
export STYLUS_NETWORK="stylus-testnet"
npm run test:performance
```

## 📊 Sample Output

```
🚀 Starting AssemblyScript Stylus Counter contract deployment performance test...
📊 AssemblyScript Stylus Deployment Performance Metrics:
   Estimated Gas Used: 150,000 gas
   Gas Price: 1,000,000,000 wei
   Estimated Total Cost: 150,000,000,000,000 wei
   Deployment Time: 1,234ms
   Contract Address: 0x0000000000000000000000000000000000000000

⚖️  Comparing AssemblyScript Stylus vs Solidity gas efficiency...
💰 Savings with AssemblyScript Stylus:
   Gas Savings: 50,000 gas (25.0%)
   Cost Savings: 50,000,000,000,000 wei

🎯 Optimization Benefits:
   Gas Savings: 40,000 gas (22.2%)
   Best Optimization Level: optimized
```

## 🛠️ Development

### Adding New Tests

1. Create test files in the `test/` directory
2. Follow the existing test structure
3. Update documentation as needed

### Customizing Contracts

1. Modify `contract.ts` with your AssemblyScript Stylus contract
2. Update test cases to match your contract's functionality
3. Run performance tests to measure improvements

### Extending Metrics

1. Modify the `DeploymentMetrics` interface
2. Update test implementations
3. Add new performance categories

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**: Ensure AssemblyScript is properly installed
2. **Test Failures**: Check TypeScript configuration
3. **Performance Variations**: Network conditions may affect results

### Debug Mode

```bash
DEBUG=* npm run test:performance
```

## 📚 Resources

- [AssemblyScript Stylus SDK Documentation](https://docs.arbitrum.io/stylus)
- [Stylus: A Gentle Introduction](https://docs.arbitrum.io/stylus/stylus-gentle-introduction)
- [AssemblyScript Documentation](https://www.assemblyscript.org/)
- [WebAssembly Performance Guide](https://webassembly.org/docs/use-cases/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your performance tests
4. Update documentation
5. Submit a pull request

## 📄 License

This project is part of the AssemblyScript Stylus SDK and follows the same licensing terms.

---

**Note**: These tests use estimated gas values for demonstration purposes. Actual gas usage may vary based on network conditions, optimization settings, and contract complexity.
