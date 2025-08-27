'use client'

import { useState, useEffect, useCallback } from 'react'
import { getChainIdFromRpc, getNetworkName } from '@/lib/validation-utils'

interface NetworkDetectionProps {
  rpcEndpoint: string
  className?: string
}

interface NetworkInfo {
  chainId: number
  name: string
  isConnected: boolean
}

export function NetworkDetection({ rpcEndpoint, className }: NetworkDetectionProps) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [walletChainId, setWalletChainId] = useState<number | null>(null)

  const detectNetwork = useCallback(async (url: string) => {
    setIsDetecting(true)
    
    try {
      const result = await getChainIdFromRpc(url)
      
      if (result.isValid && result.networkInfo) {
        setNetworkInfo({
          chainId: result.networkInfo.chainId,
          name: result.networkInfo.name,
          isConnected: result.networkInfo.chainId === walletChainId,
        })
      } else {
        setNetworkInfo(null)
      }
    } catch (error) {
      setNetworkInfo(null)
    } finally {
      setIsDetecting(false)
    }
  }, [walletChainId])

  useEffect(() => {
    if (rpcEndpoint) {
      detectNetwork(rpcEndpoint)
    }
  }, [rpcEndpoint, detectNetwork])

  useEffect(() => {
    detectWalletNetwork()
    
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        setWalletChainId(parseInt(chainId, 16))
      }
      
      window.ethereum.on('chainChanged', handleChainChanged)
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const detectWalletNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      setWalletChainId(parseInt(chainId, 16))
    } catch (error) {
      console.error('Failed to detect wallet network:', error)
    }
  }


  const getStatusColor = () => {
    if (isDetecting) return 'text-yellow-600'
    if (!networkInfo) return 'text-red-600'
    if (networkInfo.isConnected) return 'text-green-600'
    return 'text-orange-600'
  }


  const getStatusText = () => {
    if (isDetecting) return 'Detecting network...'
    if (!networkInfo) return 'Network detection failed'
    if (networkInfo.isConnected) {
      return `Connected to ${networkInfo.name}`
    }
    return `RPC: ${networkInfo.name}, Wallet: ${getNetworkName(walletChainId || 0)}`
  }

  if (!rpcEndpoint) return null

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()} ${className || ''}`}>
      <span>{getStatusText()}</span>
      {networkInfo && !networkInfo.isConnected && walletChainId && networkInfo.chainId !== walletChainId && (
        <span className="text-xs text-gray-500">
          (Chain mismatch)
        </span>
      )}
    </div>
  )
}