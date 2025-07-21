"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/code-block"

const erc20Code = `// ERC-20 Token Contract
// @ts-nocheck

@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  value: U256;
}

@Event
export class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  value: U256;
}

@Contract
export class ERC20Full {
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static allowances: Mapping2<Address, Address, U256> = new Mapping2<Address, Address, U256>();
  static totalSupply: U256;
  static name: Str;
  static symbol: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    name = nameStr;
    symbol = symbolStr;
  }

  @View
  static name(): string {
    return name;
  }

  @View
  static symbol(): string {
    return symbol;
  }

  @View
  static decimals(): U256 {
    return U256Factory.fromString("18");
  }

  @View
  static totalSupply(): U256 {
    return totalSupply;
  }

  @View
  static balanceOf(account: Address): U256 {
    return balances.get(account);
  }

  @View
  static allowance(owner: Address, spender: Address): U256 {
    return allowances.get(owner, spender);
  }

  @External
  static transfer(to: Address, amount: U256): boolean {
    const sender = msg.sender;
    const senderBal = balances.get(sender);
    if (senderBal < amount) {
      return false;
    }
    balances.set(sender, senderBal.sub(amount));
    const recvBal = balances.get(to);
    balances.set(to, recvBal.add(amount));
    Transfer.emit(sender, to, amount);
    return true;
  }

  @External
  static approve(spender: Address, amount: U256): boolean {
    const owner = msg.sender;
    allowances.set(owner, spender, amount);
    Approval.emit(owner, spender, amount);
    return true;
  }

  @External
  static transferFrom(from: Address, to: Address, amount: U256): boolean {
    const spender = msg.sender;
    const allowed = allowances.get(from, spender);
    if (allowed < amount) {
      return false;
    }
    const fromBal = balances.get(from);
    if (fromBal < amount) {
      return false;
    }
    const newAllowed = allowed.sub(amount);
    balances.set(from, fromBal.sub(amount));
    const toBal = balances.get(to);
    balances.set(to, toBal.add(amount));
    allowances.set(from, spender, newAllowed);
    Transfer.emit(from, to, amount);
    Approval.emit(from, spender, newAllowed);
    return true;
  }

  @External
  static mint(to: Address, amount: U256): void {
    totalSupply = totalSupply.add(amount);
    const toAmount = balances.get(to);
    const newAmount = toAmount.add(amount);
    balances.set(to, newAmount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(AddressZero, to, amount);
  }

  @External
  static burn(amount: U256): void {
    const sender = msg.sender;
    const senderBal = balances.get(sender);
    if (senderBal < amount) {
      return;
    }
    balances.set(sender, senderBal.sub(amount));
    totalSupply = totalSupply.sub(amount);
    const AddressZero = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    Transfer.emit(sender, AddressZero, amount);
  }
}`

const erc721Code = `// ERC-721 NFT Contract
// @ts-nocheck

@Error
class ERC721InvalidOwner {
  owner: Address;
}

@Error
class ERC721NonexistentToken {
  tokenId: U256;
}

@Error
class ERC721IncorrectOwner {
  sender: Address;
  tokenId: U256;
  owner: Address;
}

@Error
class ERC721InvalidSender {
  sender: Address;
}

@Error
class ERC721InvalidReceiver {
  receiver: Address;
}

@Error
class ERC721InsufficientApproval {
  sender: Address;
  tokenId: U256;
}

@Error
class ERC721InvalidApprover {
  approver: Address;
}

@Error
class ERC721InvalidOperator {
  operator: Address;
}

@Event
export class Transfer {
  @Indexed from: Address;
  @Indexed to: Address;
  @Indexed tokenId: U256;
}

@Event
export class Approval {
  @Indexed owner: Address;
  @Indexed spender: Address;
  @Indexed tokenId: U256;
}

@Event
export class ApprovalForAll {
  @Indexed owner: Address;
  @Indexed operator: Address;
  approved: boolean;
}

@Contract
export class ERC721 {
  // Storage mappings
  static owners: Mapping<U256, Address> = new Mapping<U256, Address>();
  static balances: Mapping<Address, U256> = new Mapping<Address, U256>();
  static tokenApprovals: Mapping<U256, Address> = new Mapping<U256, Address>();
  static operatorApprovals: Mapping2<Address, Address, boolean> = new Mapping2<Address, Address, boolean>();
  static name: Str;
  static symbol: Str;

  constructor(_name: string, _symbol: string) {
    const nameStr = StrFactory.fromString(_name);
    const symbolStr = StrFactory.fromString(_symbol);
    name = nameStr;
    symbol = symbolStr;
  }

  // ===== EXTERNAL FUNCTIONS =====

  @External
  static approve(to: Address, tokenId: U256): void {
    const authorizer = msg.sender;
    const owner = owners.get(tokenId);
    const isOwnerZero = owner.isZero();
    if (isOwnerZero) {
      ERC721NonexistentToken.revert(tokenId);
    }
    const isOwnerAuth = owner.equals(authorizer);
    const isApprovedForAll = operatorApprovals.get(owner, authorizer);
    const isAuthorized = isOwnerAuth || isApprovedForAll;
    if (!isAuthorized) {
      ERC721InvalidApprover.revert(authorizer);
    }
    tokenApprovals.set(tokenId, to);
    Approval.emit(owner, to, tokenId);
  }

  @External
  static setApprovalForAll(operator: Address, approved: boolean): void {
    const isOperatorZero = operator.isZero();
    if (isOperatorZero) {
      ERC721InvalidOperator.revert(operator);
    }
    const owner = msg.sender;
    operatorApprovals.set(owner, operator, approved);
    ApprovalForAll.emit(owner, operator, approved);
  }

  @External
  static transferFrom(from: Address, to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");
    
    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(to);
    }
    
    const owner = owners.get(tokenId);
    const authorizer = msg.sender;
    const isOwnerZero = owner.isZero();
    const approvedAddress = tokenApprovals.get(tokenId);
    const isApprovedForAll = operatorApprovals.get(owner, authorizer);
    const isAuthOwner = authorizer.equals(owner);
    const isAuthApproved = authorizer.equals(approvedAddress);
    const isAuthorized = isAuthOwner || isAuthApproved || isApprovedForAll;
    
    if (!isAuthorized) {
      if (isOwnerZero) {
        ERC721NonexistentToken.revert(tokenId);
      } else {
        ERC721InsufficientApproval.revert(authorizer, tokenId);
      }
    }
    
    const isFromOwner = owner.equals(from);
    if (!isFromOwner) {
      ERC721IncorrectOwner.revert(authorizer, tokenId, owner);
    }
    
    const isFromZero = owner.isZero();
    if (!isFromZero) {
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(owner);
      balances.set(owner, fromBalance.sub(one));
    }
    
    if (!isToZero) {
      const toBalance = balances.get(to);
      balances.set(to, toBalance.add(one));
    }
    
    owners.set(tokenId, to);
    Transfer.emit(owner, to, tokenId);
  }

  @External
  static mint(to: Address, tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");
    
    const isToZero = to.isZero();
    if (isToZero) {
      ERC721InvalidReceiver.revert(zeroAddress);
    }
    
    const from = owners.get(tokenId);
    const isFromZero = from.isZero();
    if (!isFromZero) {
      ERC721InvalidSender.revert(zeroAddress);
    }
    
    if (!isToZero) {
      const toBalance = balances.get(to);
      balances.set(to, toBalance.add(one));
    }
    
    owners.set(tokenId, to);
    Transfer.emit(from, to, tokenId);
  }

  @External
  static burn(tokenId: U256): void {
    const zeroAddress = AddressFactory.fromString("0x0000000000000000000000000000000000000000");
    const one = U256Factory.fromString("1");
    
    const from = owners.get(tokenId);
    const isFromZero = from.isZero();
    if (!isFromZero) {
      tokenApprovals.set(tokenId, zeroAddress);
      const fromBalance = balances.get(from);
      balances.set(from, fromBalance.sub(one));
    }
    
    owners.set(tokenId, zeroAddress);
    Transfer.emit(from, zeroAddress, tokenId);
    
    if (isFromZero) {
      ERC721NonexistentToken.revert(tokenId);
    }
  }

  // ===== VIEW FUNCTIONS =====

  @View
  static balanceOf(owner: Address): U256 {
    const isOwnerZero = owner.isZero();
    if (isOwnerZero) {
      ERC721InvalidOwner.revert(owner);
    }
    return balances.get(owner);
  }

  @View
  static ownerOf(tokenId: U256): Address {
    const owner = owners.get(tokenId);
    const isZero = owner.isZero();
    if (isZero) ERC721NonexistentToken.revert(tokenId);
    return owner;
  }

  @View
  static name(): string {
    return name;
  }

  @View
  static symbol(): string {
    return symbol;
  }

  @View
  static getApproved(tokenId: U256): Address {
    const owner = owners.get(tokenId);
    const isZero = owner.isZero();
    if (isZero) ERC721NonexistentToken.revert(tokenId);
    return tokenApprovals.get(tokenId);
  }

  @View
  static isApprovedForAll(owner: Address, operator: Address): boolean {
    return operatorApprovals.get(owner, operator);
  }
}`

const onboardingSteps = [
  {
    step: "Step 1: Generate contract",
    description: "Create a new contract template",
    command: "npx as-sdk generate my-contract",
  },
  {
    step: "Step 2: Copy / edit the contract",
    description: "",
    command: "",
  },
  {
    step: "Step 3: Build contract",
    description: "Compile TypeScript to WASM",
    command: "cd my-contract && npx as-sdk build",
  },
  {
    step: "Step 4: Import your PRIVATE_KEY",
    description: "",
    command: "",
  },
  {
    step: "Step 5: Deploy contract",
    description: "Deploy to Arbitrum network",
    command: "npx as-sdk deploy",
  },
]

export function Playground() {
  const [activeContract, setActiveContract] = useState<"ERC20" | "ERC721">("ERC20")

  return (
    <section id="playground" className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Up and running in under 60s</h2>
        <p className="text-gray-400 text-center mb-16">Three commands to deploy your first Stylus contract</p>

        {/* Segmented Control */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-full border border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveContract("ERC20")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeContract === "ERC20" ? "bg-[#12aaff] text-white shadow-lg" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                ERC20
              </button>
              <button
                onClick={() => setActiveContract("ERC721")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeContract === "ERC721" ? "bg-[#12aaff] text-white shadow-lg" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                ERC721
              </button>
            </div>
          </div>
        </div>

        {/* Main Card Container */}
        <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2">
              {/* Left Pane - Code Preview */}
              <div className="border-r border-gray-700">
                <CodeBlock
                  code={activeContract === "ERC20" ? erc20Code : erc721Code}
                  showCopy
                  height="600px"
                />
              </div>

              {/* Right Pane - Onboarding Steps */}
              <div className="p-8 flex flex-col justify-center">
                <div className="space-y-6">
                  {onboardingSteps.map((step, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">{step.step}</h3>
                      {step.description && <p className="text-gray-400 text-sm">{step.description}</p>}
                      {step.command && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mt-2">
                          <code className="text-[#2db5ff] font-mono text-sm">{step.command}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
