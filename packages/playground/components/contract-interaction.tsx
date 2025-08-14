"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ExternalLink, CheckCircle } from "lucide-react"
import { useContract } from "@/hooks/use-contract"
import { useContract as useContractContext } from "@/contexts/contract-context"
import type { Address } from "viem"
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
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [results, setResults] = useState<Record<string, React.ReactNode>>({})
  const [inputValues, setInputValues] = useState<Record<string, Record<string, string | boolean>>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [resultTimeouts, setResultTimeouts] = useState<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    return () => {
      Object.values(resultTimeouts).forEach(clearTimeout)
    }
  }, [resultTimeouts])

  const scheduleResultClear = (functionName: string) => {
    if (resultTimeouts[functionName]) {
      clearTimeout(resultTimeouts[functionName])
    }

    const timeoutId = setTimeout(() => {
      setResults(prev => {
        const newResults = { ...prev }
        delete newResults[functionName]
        return newResults
      })
      setResultTimeouts(prev => {
        const newTimeouts = { ...prev }
        delete newTimeouts[functionName]
        return newTimeouts
      })
    }, 30000)

    setResultTimeouts(prev => ({ ...prev, [functionName]: timeoutId }))
  }

  const { activeContract: contractType } = useContractContext()

  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const currentAbi = (contractType === "ERC20" ? erc20Abi : erc721Abi) as any[]
  const functions = currentAbi.filter((item) => item.type === "function") as ContractFunction[]
  const readFunctions = functions.filter((fn) => fn.stateMutability === "view" || fn.stateMutability === "pure")
  const writeFunctions = functions.filter(
    (fn) => fn.stateMutability === "nonpayable" || fn.stateMutability === "payable",
  )

  const contract = useContract({
    address: isConfirmed ? (contractAddress as Address) : undefined,
    abi: currentAbi as any,
    enabled: isConfirmed && !!contractAddress
  })

  const isAnyLoading = Object.values(loadingStates).some(loading => loading)

  const handleWalletConnection = () => {
    if (isConnected) {
      disconnect()
    } else {
      const injectedConnector = connectors.find(c => c.id === 'injected')
      if (injectedConnector) {
        connect({ connector: injectedConnector })
      }
    }
  }

  const handleConfirmAddress = () => {
    if (!contractAddress || !contractAddress.startsWith("0x") || contractAddress.length !== 42) {
      alert("Please enter a valid contract address (0x...)")
      return
    }
    setIsConfirmed(true)
    setResults({})
  }

  const handleReset = () => {
    setIsConfirmed(false)
    setResults({})
    setInputValues({})
  }

  const handleFunctionCall = async (functionName: string, isWrite = false) => {
    if (!contract) return

    setLoadingStates(prev => ({ ...prev, [functionName]: true }))

    try {
      const inputs = inputValues[functionName] || {}
      const functionDef = functions.find((fn) => fn.name === functionName)
      
      if (!functionDef) {
        throw new Error(`Function ${functionName} not found`)
      }

      const args = functionDef.inputs.map((input) => {
        const value = inputs[input.name]
        
        // Convertir valores según el tipo
        switch (input.type) {
          case "bool":
            // Si es boolean, usarlo directamente; si es string, convertir
            if (typeof value === "boolean") {
              return value
            } else if (typeof value === "string") {
              return value === "true"
            }
            return false // valor por defecto
            
          case "uint256":
          case "uint":
            // Convertir string a bigint para números
            if (typeof value === "string" && value) {
              return BigInt(value)
            }
            return BigInt(0)
            
          case "int256":
          case "int":
            // Convertir string a bigint para números
            if (typeof value === "string" && value) {
              return BigInt(value)
            }
            return BigInt(0)
            
          case "address":
            // Asegurar que sea una dirección válida
            if (typeof value === "string" && value.startsWith("0x")) {
              return value as Address
            }
            return "0x0000000000000000000000000000000000000000" as Address
            
          default:
            // Para strings y otros tipos, usar el valor tal como está
            return value || ""
        }
      })

      if (isWrite) {
        if (!isConnected) {
          alert("Please connect your wallet to perform write operations")
          return
        }
        const result = await contract.write(functionName, args)
        if (result.success) {
          setResults((prev) => ({
            ...prev,
            [functionName]: (
              <span className="flex items-center gap-2">
                <span className="text-[#bf2968] font-medium">Transaction completed.</span>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#bf2968] hover:text-[#e04b8a] underline decoration-dotted flex items-center gap-1"
                >
                  View transaction on Arbiscan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            ),
          }))
          scheduleResultClear(functionName)
        } else {
          setResults((prev) => ({
            ...prev,
            [functionName]: `Error: ${result.error?.name || "Unknown error"}`,
          }))
          scheduleResultClear(functionName)
        }
      } else {
        const result = await contract.read(functionName, args)
        if (result.success) {
          setResults((prev) => ({
            ...prev,
            [functionName]: String(result.data),
          }))
          scheduleResultClear(functionName)
        } else {
          setResults((prev) => ({
            ...prev,
            [functionName]: `Error: ${result.error?.name || "Unknown error"}`,
          }))
          scheduleResultClear(functionName)
        }
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [functionName]: `Error: ${error}`,
      }))
    } finally {
      setLoadingStates(prev => ({ ...prev, [functionName]: false }))
    }
  }

  const handleInputChange = (functionName: string, inputName: string, value: string | boolean) => {
    setInputValues((prev) => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        [inputName]: value,
      },
    }))
  }

  const handleBooleanChange = (functionName: string, inputName: string, value: boolean) => {
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
        {input.type === "bool" ? (
          <div className="relative">
            <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded-md hover:border-gray-500 transition-colors">
              <span className="text-sm text-gray-300">
                {inputValues[func.name]?.[input.name] === true ? "True" : "False"}
              </span>
              <button
                type="button"
                onClick={() => {
                  const currentValue = inputValues[func.name]?.[input.name] === true;
                  handleBooleanChange(func.name, input.name, !currentValue);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stylus-primary focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  inputValues[func.name]?.[input.name] === true 
                    ? "bg-stylus-primary" 
                    : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    inputValues[func.name]?.[input.name] === true 
                      ? "translate-x-6" 
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          <Input
            placeholder={`Enter ${input.name}`}
            value={String(inputValues[func.name]?.[input.name] || "")}
            onChange={(e) => handleInputChange(func.name, input.name, e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
          />
        )}
      </div>
    ))
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Interact with your contract</h2>
        <p className="text-gray-400 text-center mb-8">Connect to your deployed contract and test its functions</p>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-700 rounded-full">
            <span className="text-gray-400 mr-2">Testing:</span>
            <span className="text-stylus-primary-light font-medium">{contractType} Contract</span>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <Button 
            onClick={handleWalletConnection}
            className={isConnected ? "bg-green-600 hover:bg-green-700" : "bg-stylus-primary hover:bg-stylus-primary-dark"}
          >
            {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
          </Button>
        </div>

        <Card className="bg-gray-900/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Contract Configuration
              {isConfirmed && <CheckCircle className="w-5 h-5 text-green-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

        {isConfirmed && (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Read Functions
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
                        disabled={isAnyLoading}
                        size="sm"
                        className="bg-stylus-primary hover:bg-stylus-primary-dark text-white disabled:opacity-50"
                      >
                        {loadingStates[func.name] ? <Loader2 className="w-4 h-4 animate-spin" /> : "Read"}
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

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Write Functions
                  <span className="text-sm text-gray-400 font-normal">({writeFunctions.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {writeFunctions.filter((func) => func.name !== "contract_constructor").map((func) => (
                  <div key={func.name} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{func.name}</h4>
                      <Button
                        onClick={() => handleFunctionCall(func.name, true)}
                        disabled={isAnyLoading}
                        size="sm"
                        className="bg-stylus-primary hover:bg-stylus-primary-dark text-white disabled:opacity-50"
                      >
                        {loadingStates[func.name] ? <Loader2 className="w-4 h-4 animate-spin" /> : "Write"}
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

        {!isConfirmed && (
          <div className="text-center py-16">
            <p className="text-gray-400">
              Enter your deployed {contractType} contract address, then click &quot;Confirm Contract&quot; to
              interact with your smart contract functions.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
