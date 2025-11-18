import { Contract, block, U256, View, Address, msg, contract, Str } from "@wakeuplabs/as-stylus";

@Contract
export class Affordance {
  @View
  getBasefee(): U256 {
    return block.basefee;
  }

  @View
  getNumber(): U256 {
    return block.number;
  }

  @View
  getTimestamp(): U256 {
    return block.timestamp;
  }

  @View
  getChainId(): U256 {
    return block.chainId;
  }

  @View
  getCoinbase(): Address {
    return block.coinbase;
  }

  @View
  getGaslimit(): U256 {
    return block.gaslimit;
  }

  @View
  getMsgSender(): Address {
    return msg.sender;
  }

  @View
  getMsgValue(): U256 {
    return msg.value;
  }

  @View
  getContractAddress(): Address {
    return contract.address;
  }
}
