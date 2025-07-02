import { debugLogI32, debugLogTxt } from "./console";
import { account_balance, call_contract, read_return_data } from "./hostio";
import { malloc } from "./memory";

const GAS_LIMIT: u64 = 500_000;

export function sendEth(to: usize, amount: usize, gas: u64 = GAS_LIMIT): u8 {
  const dataPtr = 0;
  const dataLen = 0;

  const outsLenPtr = malloc(8);
  store<u64>(outsLenPtr, 0);

  const res = call_contract(to, dataPtr, dataLen, amount, gas, outsLenPtr);

  debugLogI32(res);

  if (res != 0) {
    const outLen = load<u64>(outsLenPtr);
    debugLogI32(<i32>outLen);

    if (outLen > 0) {
      const outPtr = malloc(<i32>outLen);
      const written = read_return_data(outPtr, 0, <i32>outLen);
      debugLogI32(<i32>written);
      debugLogTxt(outPtr, <i32>written);
    }
  }

  return res;
}

export function getBalance(ptrAddress: usize): usize {
  const ptrData = malloc(32);
  account_balance(ptrAddress + 3 * 4, ptrData);
  return ptrData;
}
