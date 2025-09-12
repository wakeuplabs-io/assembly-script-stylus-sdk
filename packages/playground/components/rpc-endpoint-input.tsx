'use client'

import { useState, useEffect, useCallback } from 'react'
import { useContract } from '@/contexts/contract-context'
import { getChainIdFromRpc, switchToNetwork } from '@/lib/validation-utils'

interface RpcEndpointInputProps {
  className?: string
}

export function RpcEndpointInput({ className }: RpcEndpointInputProps) {
  const { rpcEndpoint, setRpcEndpoint } = useContract()
  const [localValue, setLocalValue] = useState(rpcEndpoint)
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null)
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null)

  const validateAndUpdateRpc = useCallback(async (url: string) => {
    setIsValidating(true)
    setValidationStatus(null)
    setDetectedNetwork(null)

    try {
      const result = await getChainIdFromRpc(url)
      
      if (result.isValid && result.networkInfo) {
        setValidationStatus('valid')
        setDetectedNetwork(result.networkInfo.name)
        setRpcEndpoint(url)
        
        await switchToNetwork(result.networkInfo.chainId, url)
      } else {
        setValidationStatus('invalid')
        setDetectedNetwork(null)
      }
    } catch (error) {
      setValidationStatus('invalid')
      setDetectedNetwork(null)
    } finally {
      setIsValidating(false)
    }
  }, [setRpcEndpoint])

  useEffect(() => {
    setLocalValue(rpcEndpoint)
  }, [rpcEndpoint])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (localValue && localValue !== rpcEndpoint) {
        await validateAndUpdateRpc(localValue)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [localValue, rpcEndpoint, validateAndUpdateRpc])


  const getInputClassName = () => {
    const baseClasses = "w-full px-3 py-2 border rounded-md text-sm transition-colors bg-gray-800 border-gray-600 text-white text-center pr-10"
    if (isValidating) return `${baseClasses} border-yellow-300`
    if (validationStatus === 'valid') return `${baseClasses} border-green-300`
    if (validationStatus === 'invalid') return `${baseClasses} border-red-300`
    return baseClasses
  }


  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        RPC Endpoint
      </label>
      <div className="relative">
        <input
          type="url"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className={getInputClassName()}
          placeholder="https://sepolia-rollup.arbitrum.io/rpc"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValidating && <span className="w-4 h-4 animate-spin text-gray-400">⏳</span>}
          {validationStatus === 'valid' && <span className="w-4 h-4 text-green-400">✓</span>}
          {validationStatus === 'invalid' && <span className="w-4 h-4 text-red-400">✗</span>}
        </div>
      </div>
      {detectedNetwork && validationStatus === 'valid' && (
        <div className="flex items-center justify-center mt-2">
          <span className="text-sm text-green-400 bg-green-900/20 border border-green-700 rounded px-2 py-1">
            Detected: {detectedNetwork}
          </span>
        </div>
      )}
    </div>
  )
}