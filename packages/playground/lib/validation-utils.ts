export interface ValidationResult {
  isValid: boolean
  message?: string
  data?: unknown
}

export interface NetworkInfo {
  chainId: number
  name: string
}

export async function getChainIdFromRpc(url: string, timeoutMs: number = 5000): Promise<ValidationResult & { networkInfo?: NetworkInfo }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        isValid: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    
    if (data.error) {
      return {
        isValid: false,
        message: `RPC Error: ${data.error.message || 'Unknown error'}`,
      }
    }

    const chainId = parseInt(data.result, 16)
    
    if (isNaN(chainId)) {
      return {
        isValid: false,
        message: 'Invalid chain ID response',
      }
    }

    return {
      isValid: true,
      networkInfo: {
        chainId,
        name: getNetworkName(chainId),
      },
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isValid: false,
        message: 'Request timeout',
      }
    }
    
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export async function validateBlockExplorer(url: string, timeoutMs: number = 5000): Promise<ValidationResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        isValid: false,
        message: 'URL must start with http:// or https://',
      }
    }

    const testTxUrl = `${url.replace(/\/$/, '')}/tx/0x0000000000000000000000000000000000000000000000000000000000000000`
    
    await fetch(testTxUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    return {
      isValid: true,
      message: 'Block explorer URL is valid',
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isValid: false,
        message: 'Request timeout',
      }
    }
    
    return {
      isValid: false,
      message: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    42161: 'Arbitrum One',
    421613: 'Arbitrum Goerli',
    421614: 'Arbitrum Sepolia',
    412346: 'Local Arbitrum Sepolia',
    10: 'Optimism',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai',
    56: 'BNB Smart Chain',
    97: 'BNB Smart Chain Testnet',
    43114: 'Avalanche C-Chain',
    43113: 'Avalanche Fuji Testnet',
  }
  
  return networks[chainId] || `Custom Network (${chainId})`
}

export async function switchToNetwork(chainId: number, rpcUrl: string): Promise<ValidationResult> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return {
      isValid: false,
      message: 'MetaMask not available',
    }
  }

  const chainIdHex = `0x${chainId.toString(16)}`
  
  try {
    // Try to switch to existing network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })

    return {
      isValid: true,
      message: 'Successfully switched to network',
    }
  } catch (switchError: unknown) {
    // If network doesn't exist, try to add it
    if ((switchError as { code?: number }).code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainIdHex,
            chainName: getNetworkName(chainId),
            nativeCurrency: { 
              name: 'ETH', 
              symbol: 'ETH', 
              decimals: 18 
            },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: null,
          }],
        })

        return {
          isValid: true,
          message: 'Successfully added and switched to network',
        }
      } catch (addError: unknown) {
        return {
          isValid: false,
          message: `Failed to add network: ${addError instanceof Error ? addError.message : 'Unknown error'}`,
        }
      }
    } else {
      return {
        isValid: false,
        message: `Failed to switch network: ${switchError instanceof Error ? switchError.message : 'Unknown error'}`,
      }
    }
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}