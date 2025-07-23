"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReactNode } from 'react'
import { WagmiProvider as WagmiProviderOrig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi-config'

const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

const WagmiProviderWrapper = ({ children, config }: any) => {
  const Provider = WagmiProviderOrig as any
  return <Provider config={config}>{children}</Provider>
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProviderWrapper config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderWrapper>
  )
} 