"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Code2 } from "lucide-react"
import { useContract } from "@/hooks/use-contract"
import { useContract as useContractContext } from "@/contexts/contract-context"
import { RpcEndpointInput } from "@/components/rpc-endpoint-input"
import { BlockExplorerInput } from "@/components/block-explorer-input"
import { NetworkDetection } from "@/components/network-detection"
import { getChainIdFromRpc, switchToNetwork } from "@/lib/validation-utils"
import { parseSolidityType, formatReturnValue } from "@/lib/abi-parser"
import type { Address, Abi } from "viem"

interface ContractFunction {
  name: string
  type: string
  stateMutability: string
  inputs: Array<{
    name: string
    type: string
    internalType?: string
  }>
  outputs: Array<{
    name?: string
    type: string
    internalType?: string
  }>
}

export function AbiExplorer() {
  const [contractAddress, setContractAddress] = useState("")
  const [abiInput, setAbiInput] = useState("")
  const [abiError, setAbiError] = useState<string | null>(null)
  const [parsedAbi, setParsedAbi] = useState<Abi | null>(null)
  const [isAbiConfirmed, setIsAbiConfirmed] = useState(false)
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

  const { rpcEndpoint, blockExplorerUrl } = useContractContext()
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const handleParseAbi = () => {
    try {
      const parsed = JSON.parse(abiInput)
      if (!Array.isArray(parsed)) {
        setAbiError("ABI must be a JSON array")
        return
      }
      setParsedAbi(parsed as Abi)
      setAbiError(null)
      setIsAbiConfirmed(true)
    } catch (error) {
      setAbiError(error instanceof Error ? error.message : "Invalid JSON")
      setIsAbiConfirmed(false)
    }
  }

  const functions = parsedAbi
    ? (parsedAbi.filter((item) => item.type === "function") as ContractFunction[])
    : []
  const readFunctions = functions.filter(
    (fn) => fn.stateMutability === "view" || fn.stateMutability === "pure"
  )
  const writeFunctions = functions.filter(
    (fn) => fn.stateMutability === "nonpayable" || fn.stateMutability === "payable"
  )

  const contract = useContract({
    address: isConfirmed && isAbiConfirmed ? (contractAddress as Address) : undefined,
    abi: parsedAbi || [],
    enabled: isConfirmed && isAbiConfirmed && !!contractAddress && !!parsedAbi
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
      setResults(prev => ({
        ...prev,
        _error: "Please enter a valid contract address (0x...)"
      }))
      return
    }
    if (!isAbiConfirmed || !parsedAbi) {
      setResults(prev => ({
        ...prev,
        _error: "Please parse a valid ABI first"
      }))
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

  const handleResetAbi = () => {
    setIsAbiConfirmed(false)
    setParsedAbi(null)
    setAbiError(null)
    setIsConfirmed(false)
    setResults({})
    setInputValues({})
  }

  const handleFunctionCall = async (functionName: string, isWrite = false) => {
    if (!contract || !parsedAbi) return

    setLoadingStates(prev => ({ ...prev, [functionName]: true }))
    setResults(prev => {
      const newResults = { ...prev }
      delete newResults._error
      return newResults
    })

    try {
      const inputs = inputValues[functionName] || {}
      const functionDef = functions.find((fn) => fn.name === functionName)

      if (!functionDef) {
        throw new Error(`Function ${functionName} not found`)
      }

      const args = functionDef.inputs.map((input) => {
        const value = inputs[input.name]
        return parseSolidityType(input.type, value)
      })

      if (isWrite) {
        if (!isConnected) {
          setResults(prev => ({
            ...prev,
            [functionName]: (
              <span className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Please connect your wallet to perform write operations
              </span>
            )
          }))
          scheduleResultClear(functionName)
          return
        }

        const rpcValidation = await getChainIdFromRpc(rpcEndpoint)
        if (rpcValidation.isValid && rpcValidation.networkInfo) {
          const switchResult = await switchToNetwork(rpcValidation.networkInfo.chainId, rpcEndpoint)
          if (!switchResult.isValid) {
            setResults(prev => ({
              ...prev,
              [functionName]: (
                <span className="text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Please switch to the correct network in MetaMask to perform this transaction
                </span>
              )
            }))
            scheduleResultClear(functionName)
            return
          }
        }

        const result = await contract.write(functionName, args)
        if (result.success && result.txHash) {
          setResults((prev) => ({
            ...prev,
            [functionName]: (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Transaction completed.</span>
                <a
                  href={`${blockExplorerUrl}tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stylus-primary hover:text-stylus-primary-light underline decoration-dotted flex items-center gap-1"
                >
                  View transaction on Block Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            ),
          }))
          scheduleResultClear(functionName)
        } else {
          const errorMessage = result.error
            ? `${result.error.name}${result.error.args.length > 0 ? `: ${JSON.stringify(result.error.args)}` : ''}`
            : "Unknown error"
          setResults((prev) => ({
            ...prev,
            [functionName]: (
              <span className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Error: {errorMessage}</span>
              </span>
            ),
          }))
          scheduleResultClear(functionName)
        }
      } else {
        const result = await contract.read(functionName, args)
        if (result.success) {
          const formattedValue = formatReturnValue(result.data)
          setResults((prev) => ({
            ...prev,
            [functionName]: (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">Success</span>
                </div>
                <pre className="text-sm text-gray-300 font-mono bg-gray-800/50 p-3 rounded overflow-x-auto">
                  {formattedValue}
                </pre>
              </div>
            ),
          }))
          scheduleResultClear(functionName)
        } else {
          const errorMessage = result.error
            ? `${result.error.name}${result.error.args.length > 0 ? `: ${JSON.stringify(result.error.args)}` : ''}`
            : "Unknown error"
          setResults((prev) => ({
            ...prev,
            [functionName]: (
              <span className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Error: {errorMessage}</span>
              </span>
            ),
          }))
          scheduleResultClear(functionName)
        }
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [functionName]: (
          <span className="text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Error: {error instanceof Error ? error.message : String(error)}</span>
          </span>
        ),
      }))
      scheduleResultClear(functionName)
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
      <div key={input.name || input.type} className="space-y-2">
        <Label className="text-sm text-gray-300">
          {input.name || 'unnamed'} ({input.type})
        </Label>
        {input.type === "bool" ? (
          <div className="relative">
            <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded-md hover:border-gray-500 transition-colors">
              <span className="text-sm text-gray-300">
                {inputValues[func.name]?.[input.name || input.type] === true ? "True" : "False"}
              </span>
              <button
                type="button"
                onClick={() => {
                  const currentValue = inputValues[func.name]?.[input.name || input.type] === true
                  handleBooleanChange(func.name, input.name || input.type, !currentValue)
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stylus-primary focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  inputValues[func.name]?.[input.name || input.type] === true
                    ? "bg-stylus-primary"
                    : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    inputValues[func.name]?.[input.name || input.type] === true
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          <Input
            placeholder={`Enter ${input.name || input.type} (${input.type})`}
            value={String(inputValues[func.name]?.[input.name || input.type] || "")}
            onChange={(e) => handleInputChange(func.name, input.name || input.type, e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
          />
        )}
      </div>
    ))
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Code2 className="w-8 h-8 text-stylus-primary" />
          <h2 className="text-3xl md:text-4xl font-bold">Contract Explorer</h2>
        </div>
        <p className="text-gray-400 mb-8">
          Interact with any smart contract by providing its ABI. Perfect for unverified contracts.
        </p>

        <div className="flex justify-center mb-4">
          <div className="w-full max-w-md">
            <RpcEndpointInput className="text-center" />
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <NetworkDetection rpcEndpoint={rpcEndpoint} className="justify-center" />
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md">
            <BlockExplorerInput className="text-center" />
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

        {/* ABI Input Section */}
        <Card className="bg-gray-900/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Contract ABI
              {isAbiConfirmed && <CheckCircle className="w-5 h-5 text-green-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Paste your contract ABI (JSON array)</Label>
              <textarea
                value={abiInput}
                onChange={(e) => {
                  setAbiInput(e.target.value)
                  setAbiError(null)
                  setIsAbiConfirmed(false)
                }}
                placeholder='[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable"}]'
                className="w-full h-64 p-4 bg-gray-800 border border-gray-600 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stylus-primary focus:border-transparent resize-y"
                spellCheck={false}
              />
              {abiError && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-900/20 border border-red-700 rounded">
                  <AlertCircle className="w-4 h-4" />
                  <span>{abiError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {!isAbiConfirmed ? (
                <Button
                  onClick={handleParseAbi}
                  disabled={!abiInput.trim()}
                  className="bg-stylus-primary hover:bg-stylus-primary-dark text-white disabled:opacity-50"
                >
                  Parse ABI
                </Button>
              ) : (
                <Button
                  onClick={handleResetAbi}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  Change ABI
                </Button>
              )}
            </div>

            {isAbiConfirmed && (
              <div className="flex items-center gap-2 text-sm text-gray-400 p-3 bg-green-900/20 border border-green-700 rounded">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">
                  ABI parsed successfully. Found {functions.length} function{functions.length !== 1 ? 's' : ''} ({readFunctions.length} read, {writeFunctions.length} write)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Address Section */}
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
                  disabled={!contractAddress || !isAbiConfirmed}
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
                  href={`${blockExplorerUrl}address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 hover:text-stylus-primary-light transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Block Explorer
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {results._error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-700 rounded flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{results._error}</span>
          </div>
        )}

        {isConfirmed && isAbiConfirmed && (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Read Functions
                  <span className="text-sm text-gray-400 font-normal">({readFunctions.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {readFunctions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No read functions found in ABI</p>
                ) : (
                  readFunctions.map((func) => (
                    <div key={func.name} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white">{func.name}</h4>
                          {func.outputs.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Returns: {func.outputs.map(o => o.type).join(', ')}
                            </p>
                          )}
                        </div>
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
                          {results[func.name]}
                        </div>
                      )}
                    </div>
                  ))
                )}
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
                {writeFunctions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No write functions found in ABI</p>
                ) : (
                  writeFunctions.map((func) => (
                    <div key={func.name} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white">{func.name}</h4>
                          {func.outputs.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Returns: {func.outputs.map(o => o.type).join(', ')}
                            </p>
                          )}
                        </div>
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
                          {results[func.name]}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {(!isConfirmed || !isAbiConfirmed) && (
          <div className="text-center py-16">
            <p className="text-gray-400">
              {!isAbiConfirmed
                ? "Paste your contract ABI and click 'Parse ABI' to get started."
                : "Enter your deployed contract address, then click 'Confirm Contract' to interact with your smart contract functions."}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
