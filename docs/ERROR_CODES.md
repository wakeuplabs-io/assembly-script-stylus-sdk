# AS-Stylus SDK Error Codes Reference

Complete reference guide for all error codes in the AS-Stylus SDK with solutions and debugging information.

## Error Code System

The AS-Stylus SDK uses HTTP-style 3-digit error codes organized by category:

- **1xx**: Validation Errors (Input/Parameters)
- **2xx**: Compilation Errors (TypeScript/AssemblyScript) 
- **3xx**: Deployment/Network Errors
- **4xx**: Runtime/Execution Errors
- **5xx**: System/Unexpected Errors

## 1xx: Validation Errors

These errors occur when input parameters or configuration values are invalid.

### 101 - INVALID_PRIVATE_KEY_FORMAT
**Description**: Your private key must start with '0x' and be exactly 66 characters long.

**Common Causes**:
- Missing '0x' prefix
- Incorrect length (not 64 hex characters + '0x')
- Invalid characters (non-hexadecimal)

**Solution**: 
```bash
# ❌ Wrong
as-stylus deploy contract.ts --private-key abc123...

# ✅ Correct  
as-stylus deploy contract.ts --private-key 0xabc123...
```

**Debugging**: Export your private key from MetaMask and ensure it starts with 0x.

---

### 102 - MISSING_PRIVATE_KEY
**Description**: Contract deployment requires a private key to sign the transaction.

**Common Causes**:
- Forgot to provide --private-key flag
- Empty private key value

**Solution**:
```bash
as-stylus deploy contract.ts --private-key 0xYOUR_PRIVATE_KEY_HERE
```

**Security Note**: Never share your private key or commit it to version control.

---

### 103 - INVALID_RPC_URL
**Description**: The RPC endpoint URL format is incorrect or unreachable.

**Common Causes**:
- Invalid URL format
- Non-HTTP/HTTPS protocol
- Unreachable endpoint

**Solution**:
```bash
# ✅ Use valid RPC endpoints
as-stylus deploy contract.ts --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

**Debugging**: Test the RPC endpoint in a browser or with curl to verify accessibility.

---

### 104 - INVALID_CONTRACT_FILE
**Description**: The specified contract file does not exist or is not readable.

**Common Causes**:
- File doesn't exist
- Wrong file path
- File doesn't have .ts extension
- Permission issues

**Solution**:
```bash
# Check file exists
ls -la contract.ts

# Ensure correct path and extension
as-stylus compile ./contract.ts
```

---

### 105 - INVALID_CONSTRUCTOR_ARGS
**Description**: The provided constructor arguments do not match the contract's constructor signature.

**Common Causes**:
- Wrong number of arguments
- Wrong argument types
- Empty string arguments

**Solution**:
```bash
# Match your contract's constructor
# constructor(name: string, symbol: string)
as-stylus deploy contract.ts --constructor-args "MyToken" "MYT"
```

---

### 106 - MISSING_CONTRACT_PATH
**Description**: No contract file path was specified.

**Solution**:
```bash
as-stylus compile contract.ts
```

---

### 107 - INVALID_PROJECT_NAME
**Description**: The project name contains invalid characters or is empty.

**Common Causes**:
- Special characters (only alphanumeric, hyphens, underscores allowed)
- Empty name
- Name too long (>50 characters)

**Solution**:
```bash
# ✅ Valid names
as-stylus generate my-token
as-stylus generate erc20_contract
```

---

### 108 - INVALID_GAS_LIMIT
**Description**: The specified gas limit is invalid or too low.

**Common Causes**:
- Non-numeric value
- Too low (< 21000)
- Too high (> 30,000,000)

**Solution**:
```bash
as-stylus deploy contract.ts --gas-limit 1000000
```

---

### 109 - MISSING_REQUIRED_PARAMETER
**Description**: A required parameter was not provided.

**Solution**: Check the command usage and provide all required parameters.

---

### 110 - INVALID_ADDRESS_FORMAT
**Description**: The provided address is not a valid Ethereum address.

**Common Causes**:
- Missing '0x' prefix
- Wrong length (not 40 hex characters)
- Invalid characters

**Solution**:
```bash
# ✅ Valid address format
0x742d35cc6570b5c2b3b5f3a5e5e5a5e5a5e5a5e5
```

## 2xx: Compilation Errors

These errors occur during TypeScript to AssemblyScript compilation.

### 201-210: Syntactic Errors

### 201 - SYNTAX_ERROR
**Description**: The TypeScript code contains syntax errors that prevent compilation.

**Common Causes**:
- Missing semicolons
- Unclosed brackets
- Invalid tokens

**Solution**: Fix syntax errors in your contract code. Use TypeScript IDE support for error detection.

**Debugging**:
1. Check the error location in the compiler output
2. Verify bracket matching
3. Ensure all statements end with semicolons

---

### 202 - INVALID_SYNTAX
**Description**: The code contains invalid TypeScript syntax.

---

### 203 - MISSING_SEMICOLON
**Description**: A semicolon is missing at the end of a statement.

**Solution**: Add the missing semicolon.

---

### 204 - INVALID_TOKEN
**Description**: An invalid token was encountered during parsing.

---

### 205 - UNEXPECTED_TOKEN
**Description**: An unexpected token was found during parsing.

---

### 206 - MISSING_BRACKET
**Description**: A closing bracket is missing.

---

### 207 - INVALID_EXPRESSION
**Description**: The expression is not valid in this context.

---

### 208 - MISSING_DECLARATION
**Description**: A required declaration is missing.

---

### 209 - INVALID_STATEMENT
**Description**: The statement is not valid in this context.

---

### 210 - PARSE_ERROR
**Description**: Failed to parse the TypeScript code.

### 251-299: Semantic Errors

### 251 - SEMANTIC_ERROR
**Description**: The code is syntactically correct but semantically invalid.

**Common Causes**:
- Type mismatches
- Undefined variables/functions
- Scope violations

---

### 252 - TYPE_MISMATCH
**Description**: The types in an expression or assignment don't match.

**Solution**: Ensure type compatibility in your expressions.

**Example**:
```typescript
// ❌ Wrong
let value: U256 = "hello"; 

// ✅ Correct
let value: U256 = U256Factory.fromString("100");
```

---

### 253 - UNDEFINED_VARIABLE
**Description**: A variable is used before being declared.

**Solution**: Declare the variable before using it.

---

### 254 - UNDEFINED_FUNCTION
**Description**: A function is called before being declared or imported.

**Solution**: Declare or import the function before using it.

---

### 255 - INVALID_ASSIGNMENT
**Description**: The assignment is not valid.

---

### 256 - SCOPE_ERROR
**Description**: A variable or function is accessed outside its scope.

---

### 257 - INHERITANCE_ERROR
**Description**: There's an error in class inheritance.

---

### 258 - INTERFACE_ERROR
**Description**: Interface implementation is incorrect.

---

### 259 - GENERIC_ERROR
**Description**: Error in generic type usage.

---

### 260 - CONTRACT_VALIDATION_ERROR
**Description**: The contract failed validation checks.

**Common Causes**:
- Missing @Contract decorator
- Invalid method signatures
- Missing required methods

## 3xx: Deployment/Network Errors

These errors occur during contract deployment to the blockchain.

### 301 - NETWORK_CONNECTION_FAILED
**Description**: Unable to connect to the specified RPC endpoint.

**Common Causes**:
- Internet connectivity issues
- RPC endpoint is down
- Firewall blocking connection
- Wrong RPC URL

**Solution**:
1. Check internet connection
2. Verify RPC endpoint is accessible
3. Try alternative RPC endpoints

**Debugging**:
```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://sepolia-rollup.arbitrum.io/rpc
```

---

### 302 - INSUFFICIENT_FUNDS
**Description**: The account doesn't have enough ETH to cover gas costs.

**Common Causes**:
- Account balance too low
- Gas price too high
- Complex contract requiring high gas

**Solution**:
1. Add ETH to your account
2. Use testnet faucets for testnets
3. Optimize contract to reduce gas usage

**Debugging**:
```bash
# Check account balance (replace with your address)
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYOUR_ADDRESS","latest"],"id":1}' \
  https://sepolia-rollup.arbitrum.io/rpc
```

---

### 303 - CONTRACT_DEPLOYMENT_FAILED
**Description**: The contract deployment transaction failed.

**Common Causes**:
- Contract code errors
- Gas limit too low
- Network congestion
- Invalid constructor parameters

**Solution**:
1. Increase gas limit
2. Check constructor arguments
3. Verify contract compiles correctly
4. Try deploying again

---

### 304 - CARGO_STYLUS_ERROR
**Description**: An error occurred while using cargo stylus.

**Common Causes**:
- Cargo stylus not installed
- Invalid WASM file
- Incompatible cargo stylus version

**Solution**:
1. Install/update cargo stylus: `cargo install cargo-stylus`
2. Verify WASM file exists and is valid
3. Check cargo stylus version compatibility

---

### 305 - RPC_ENDPOINT_ERROR
**Description**: The RPC endpoint returned an error.

---

### 306 - TRANSACTION_FAILED
**Description**: The blockchain transaction failed.

---

### 307 - GAS_ESTIMATION_FAILED
**Description**: Unable to estimate gas for the transaction.

---

### 308 - NONCE_ERROR
**Description**: Transaction nonce is incorrect.

---

### 309 - CHAIN_ID_MISMATCH
**Description**: The chain ID doesn't match the target network.

---

### 310 - CONTRACT_VERIFICATION_FAILED
**Description**: The deployed contract failed verification.

## 4xx: Runtime/Execution Errors

These errors occur during contract execution or code transformation.

### 401 - CONTRACT_EXECUTION_FAILED
**Description**: The contract function execution failed.

**Common Causes**:
- Function reverted
- Invalid parameters
- Contract logic errors

---

### 402 - FUNCTION_NOT_FOUND
**Description**: The specified function was not found in the contract.

**Solution**: Check the function name and contract ABI.

---

### 403 - INVALID_FUNCTION_CALL
**Description**: The function call is invalid or malformed.

---

### 404 - REVERT_ERROR
**Description**: The contract execution was reverted.

**Debugging**: Check contract conditions and error messages.

---

### 405 - OUT_OF_GAS
**Description**: The transaction ran out of gas.

**Solution**: Increase the gas limit for complex operations.

---

### 406 - STACK_OVERFLOW
**Description**: The execution stack overflowed.

**Common Causes**:
- Deep recursion
- Complex nested expressions
- Infinite loops

**Solution**: 
1. Simplify complex expressions
2. Avoid deep recursion
3. Break operations into steps

**Example**:
```typescript
// ❌ Problematic - deep nesting
return amount.mul(getRate()).div(getTotalSupply()).add(getFee(amount));

// ✅ Solution - step by step
const rate = getRate();
const step1 = amount.mul(rate);
const totalSupply = getTotalSupply();
const step2 = step1.div(totalSupply);
const fee = getFee(amount);
return step2.add(fee);
```

---

### 407 - ASSEMBLY_SCRIPT_ERROR
**Description**: Error in generated AssemblyScript code.

**Debugging**: Check the transformed AssemblyScript output in artifacts/.

---

### 408 - TRANSFORMER_ERROR
**Description**: Error in code transformation process.

---

### 409 - IR_GENERATION_ERROR
**Description**: Failed to generate intermediate representation.

---

### 410 - HANDLER_ERROR
**Description**: Error in expression handler.

## 5xx: System/Unexpected Errors

These errors indicate system-level problems or unexpected conditions.

### 501 - UNKNOWN_ERROR
**Description**: An unexpected error occurred.

**Action**: Please report this issue with the full error message to the development team.

---

### 502 - FILESYSTEM_ERROR
**Description**: Unable to read or write files.

**Common Causes**:
- Permission denied
- File doesn't exist
- Disk full
- File locked by another process

**Solution**:
1. Check file permissions
2. Ensure sufficient disk space
3. Verify file paths are correct

---

### 503 - MEMORY_ERROR
**Description**: Insufficient memory to complete the operation.

**Solution**:
1. Close other applications
2. Use smaller data sets
3. Restart the process

---

### 504 - TIMEOUT_ERROR
**Description**: The operation timed out.

**Solution**: Try again or increase timeout settings if available.

---

### 505 - INTERNAL_ERROR
**Description**: An internal error occurred in the SDK.

**Action**: Please report this issue to the development team.

---

### 506 - CONFIGURATION_ERROR
**Description**: Invalid configuration detected.

**Solution**: Check your configuration files and settings.

---

### 507 - DEPENDENCY_ERROR
**Description**: Required dependency is missing or invalid.

**Solution**:
1. Run `npm install` to install dependencies
2. Check package.json for correct versions
3. Ensure all required tools are installed

---

### 508 - ENVIRONMENT_ERROR
**Description**: Invalid environment configuration.

**Solution**: Check environment variables and system settings.

---

### 509 - PERMISSION_ERROR
**Description**: Insufficient permissions to perform the operation.

**Solution**: Check file and directory permissions.

---

### 510 - RESOURCE_EXHAUSTED
**Description**: System resources are exhausted.

**Solution**: Free up system resources and try again.

## Common Debugging Workflows

### Compilation Issues (2xx codes)
1. Check TypeScript syntax with IDE
2. Verify all imports are correct
3. Check contract decorators (@Contract, @External, etc.)
4. Review error location in compiler output

### Deployment Issues (3xx codes)
1. Verify network connectivity
2. Check account balance
3. Test RPC endpoint separately
4. Review constructor arguments
5. Increase gas limit if needed

### Runtime Issues (4xx codes)
1. Simplify complex expressions
2. Check generated AssemblyScript in artifacts/
3. Verify function calls and parameters
4. Test contract logic step by step

### System Issues (5xx codes)
1. Check file permissions
2. Verify disk space
3. Restart the process
4. Report unexpected errors to development team

## Getting Help

If you encounter an error not covered in this guide:

1. **Check the full error message** for specific details
2. **Look for error codes** in brackets [xxx]
3. **Check the artifacts/** directory for generated files
4. **Report issues** at https://github.com/anthropics/claude-code/issues
5. **Include error code and full message** when reporting

## Error Code Quick Reference

### By Category
- **1xx**: Input validation - Check parameters
- **2xx**: Compilation - Fix code syntax/semantics  
- **3xx**: Deployment - Check network/account
- **4xx**: Runtime - Simplify expressions
- **5xx**: System - Check environment

### Most Common Errors
- **101**: Add 0x prefix to private key
- **104**: Check contract file path exists
- **302**: Add funds to account
- **406**: Simplify complex expressions
- **502**: Check file permissions