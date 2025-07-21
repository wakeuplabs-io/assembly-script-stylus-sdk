"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ExternalLink, CheckCircle } from "lucide-react"
import erc20Abi from "@/abis/erc20.json"
import erc721Abi from "@/abis/erc721.json"

interface ContractFunction {
  name: string
  type: string
  stateMutability: string
  inputs: Array<{
    name: string
    type: string
  }>
  outputs: Array<{
    type: string
  }>
}

export function ContractInteraction() {
  const [contractAddress, setContractAddress] = useState("")
  const [contractType, setContractType] = useState<"ERC20" | "ERC721">("ERC20")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Record<string, React.ReactNode>>({})
  const [inputValues, setInputValues] = useState<Record<string, Record<string, string>>>({})

  const currentAbi = contractType === "ERC20" ? erc20Abi : erc721Abi
  const functions = currentAbi.filter((item) => item.type === "function") as ContractFunction[]

  const readFunctions = functions.filter((fn) => fn.stateMutability === "view" || fn.stateMutability === "pure")
  const writeFunctions = functions.filter(
    (fn) => fn.stateMutability === "nonpayable" || fn.stateMutability === "payable",
  )

  const handleConfirmAddress = () => {
    if (!contractAddress || !contractAddress.startsWith("0x") || contractAddress.length !== 42) {
      alert("Please enter a valid contract address (0x...)")
      return
    }
    setIsConfirmed(true)
    setResults({}) // Clear previous results
  }

  const handleReset = () => {
    setIsConfirmed(false)
    setResults({})
    setInputValues({})
  }

  const handleFunctionCall = async (functionName: string, isWrite = false) => {
    setIsLoading(true)

    // Simulate contract call
    setTimeout(() => {
      const mockResults: Record<string, React.ReactNode> = {
        name: "MyToken",
        symbol: "MTK",
        decimals: "18",
        totalSupply: "1000000000000000000000000",
        balanceOf: "500000000000000000000",
        allowance: "0",
        ownerOf: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        getApproved: "0x0000000000000000000000000000000000000000",
        isApprovedForAll: false,
      }

      setResults((prev) => ({
        ...prev,
        [functionName]: mockResults[functionName] || (isWrite ? "Transaction sent successfully!" : "No data"),
      }))
      setIsLoading(false)
    }, 1500)
  }

  const handleInputChange = (functionName: string, inputName: string, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        [inputName]: value,
      },
    }))
  }

  const renderFunctionInputs = (func: ContractFunction) => {
    return func.inputs.map((input) => (
      <div key={input.name} className="space-y-2">
        <Label className="text-sm text-gray-300">
          {input.name} ({input.type})
        </Label>
        <Input
          placeholder={`Enter ${input.name}`}
          value={inputValues[func.name]?.[input.name] || ""}
          onChange={(e) => handleInputChange(func.name, input.name, e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>
    ))
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Interact with your contract</h2>
        <p className="text-gray-400 text-center mb-16">Connect to your deployed contract and test its functions</p>

        {/* Contract Setup */}
        <Card className="bg-gray-900/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Contract Configuration
              {isConfirmed && <CheckCircle className="w-5 h-5 text-green-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Contract Address</Label>
                <Input
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  disabled={isConfirmed}
                  className="bg-gray-800 border-gray-600 text-white disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Contract Type</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setContractType("ERC20")}
                    disabled={isConfirmed}
                    variant={contractType === "ERC20" ? "default" : "outline"}
                    className={
                      contractType === "ERC20"
                        ? "bg-stylus-primary hover:bg-stylus-primary-dark text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                    }
                  >
                    ERC20
                  </Button>
                  <Button
                    onClick={() => setContractType("ERC721")}
                    disabled={isConfirmed}
                    variant={contractType === "ERC721" ? "default" : "outline"}
                    className={
                      contractType === "ERC721"
                        ? "bg-stylus-secondary hover:bg-stylus-secondary-dark text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                    }
                  >
                    ERC721
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {!isConfirmed ? (
                <Button
                  onClick={handleConfirmAddress}
                  disabled={!contractAddress}
                  className="bg-stylus-primary hover:bg-stylus-primary-dark text-white disabled:opacity-50"
                >
                  Confirm Contract
                </Button>
              ) : (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  Change Contract
                </Button>
              )}
            </div>

            {isConfirmed && (
              <div className="flex items-center gap-2 text-sm text-gray-400 p-3 bg-green-900/20 border border-green-700 rounded">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Contract confirmed:</span>
                <code className="text-green-300 font-mono">{contractAddress}</code>
                <a
                  href={`https://sepolia.arbiscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                                        className="ml-auto flex items-center gap-1 hover:text-stylus-primary-light transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Arbiscan
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Function Sections - Only show when confirmed */}
        {isConfirmed && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Read Functions */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  📖 Read Functions
                  <span className="text-sm text-gray-400 font-normal">({readFunctions.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {readFunctions.map((func) => (
                  <div key={func.name} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{func.name}</h4>
                      <Button
                        onClick={() => handleFunctionCall(func.name)}
                        disabled={isLoading}
                        size="sm"
                        className="bg-stylus-primary hover:bg-stylus-primary-dark text-white"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Read"}
                      </Button>
                    </div>

                    {func.inputs.length > 0 && <div className="space-y-3 mb-3">{renderFunctionInputs(func)}</div>}

                    {results[func.name] && (
                      <div className="mt-3 p-3 bg-stylus-primary/10 border border-stylus-primary/30 rounded">
                        <p className="text-stylus-primary-light text-sm font-mono">{results[func.name]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Write Functions */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  ✏️ Write Functions
                  <span className="text-sm text-gray-400 font-normal">({writeFunctions.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {writeFunctions.map((func) => (
                  <div key={func.name} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{func.name}</h4>
                      <Button
                        onClick={() => handleFunctionCall(func.name, true)}
                        disabled={isLoading}
                        size="sm"
                        className="bg-stylus-secondary hover:bg-stylus-secondary-dark text-white"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Write"}
                      </Button>
                    </div>

                    {func.inputs.length > 0 && <div className="space-y-3 mb-3">{renderFunctionInputs(func)}</div>}

                    {results[func.name] && (
                      <div className="mt-3 p-3 bg-pink-900/20 border border-pink-700 rounded">
                        <p className="text-pink-400 text-sm">{results[func.name]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Placeholder when not confirmed */}
        {!isConfirmed && (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg mb-4">👆 Please confirm your contract address to continue</div>
            <p className="text-gray-400">
              Enter your deployed contract address and select the contract type, then click &quot;Confirm Contract&quot; to
              interact with your smart contract functions.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
