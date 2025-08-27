'use client'

import { useState, useEffect, useCallback } from 'react'
import { useContract } from '@/contexts/contract-context'
import { validateBlockExplorer } from '@/lib/validation-utils'

interface BlockExplorerInputProps {
  className?: string
}

export function BlockExplorerInput({ className }: BlockExplorerInputProps) {
  const { blockExplorerUrl, setBlockExplorerUrl } = useContract()
  const [localValue, setLocalValue] = useState(blockExplorerUrl)
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null)

  const validateAndUpdateBlockExplorer = useCallback(async (url: string) => {
    setIsValidating(true)
    setValidationStatus(null)

    try {
      const result = await validateBlockExplorer(url)
      
      if (result.isValid) {
        setValidationStatus('valid')
        setBlockExplorerUrl(url)
      } else {
        setValidationStatus('invalid')
      }
    } catch (error) {
      setValidationStatus('invalid')
    } finally {
      setIsValidating(false)
    }
  }, [setBlockExplorerUrl])

  useEffect(() => {
    setLocalValue(blockExplorerUrl)
  }, [blockExplorerUrl])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (localValue && localValue !== blockExplorerUrl) {
        await validateAndUpdateBlockExplorer(localValue)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [localValue, blockExplorerUrl, validateAndUpdateBlockExplorer])

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
        Block Explorer
      </label>
      <div className="relative">
        <input
          type="url"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className={getInputClassName()}
          placeholder="https://sepolia.arbiscan.io"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValidating && <span className="w-4 h-4 animate-spin text-gray-400">⏳</span>}
          {validationStatus === 'valid' && <span className="w-4 h-4 text-green-400">✓</span>}
          {validationStatus === 'invalid' && <span className="w-4 h-4 text-red-400">✗</span>}
        </div>
      </div>
    </div>
  )
}