"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Play, Loader2 } from "lucide-react"
import { useClipboard } from "@/hooks/use-clipboard"
import { CodeBlock } from "@/components/code-block"

const contractCode = `// ERC-20 Token Contract
import { ERC20 } from '@as-sdk/erc20'

export class MyToken extends ERC20 {
  constructor() {
    super("MyToken", "MTK", 18)
    this._mint(msg.sender, 1000000)
  }
  
  function burn(amount: u256): void {
    this._burn(msg.sender, amount)
  }
}`

const abiCode = `[
  {
    "type": "function",
    "name": "name",
    "outputs": [{"type": "string"}]
  },
  {
    "type": "function", 
    "name": "balanceOf",
    "inputs": [{"type": "address", "name": "account"}],
    "outputs": [{"type": "uint256"}]
  }
]`

export function Playground() {
  const [activeTab, setActiveTab] = useState("code")
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<string>("")
  const [address, setAddress] = useState("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6")
  const { copy } = useClipboard()

  const handleBalanceCheck = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setBalance("1000000")
      setIsLoading(false)
    }, 1500)
  }

  return (
    <section id="playground" className="py-20 px-4 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Try it live</h2>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Interactive Contract Playground</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="code" className="text-gray-300">
                  Code
                </TabsTrigger>
                <TabsTrigger value="interact" className="text-gray-300">
                  Interact
                </TabsTrigger>
                <TabsTrigger value="abi" className="text-gray-300">
                  ABI
                </TabsTrigger>
                <TabsTrigger value="explorer" className="text-gray-300">
                  Explorer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="mt-6">
                <div className="relative">
                  <CodeBlock code={contractCode} language="typescript" />
                  <Button
                    onClick={() => copy(contractCode)}
                    size="sm"
                    variant="outline"
                    className="absolute top-4 right-4 bg-gray-800 border-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="interact" className="mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Check Balance</label>
                    <div className="flex gap-2">
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter address"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <Button
                        onClick={handleBalanceCheck}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {balance && (
                    <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                      <p className="text-green-400">Balance: {balance} MTK</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="abi" className="mt-6">
                <CodeBlock code={abiCode} language="json" />
              </TabsContent>

              <TabsContent value="explorer" className="mt-6">
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Contract deployed on Arbitrum Sepolia</p>
                  <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
                    View on Arbiscan
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
