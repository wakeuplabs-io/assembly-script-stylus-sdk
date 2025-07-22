"use client"

import { useContract } from "@/contexts/contract-context"
import { Code2, Coins } from "lucide-react"

export function ContractSelector() {
  const { activeContract, setActiveContract } = useContract()

  return (
    <section id="contract-selector" className="py-20 px-4 bg-gradient-to-b from-[#0E0E10] to-transparent">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Contract Type
        </h2>
        <p className="text-xl text-gray-400 mb-12">
          Select the token standard you want to explore. This choice will guide your entire journey.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* ERC20 Card */}
          <button
            onClick={() => setActiveContract("ERC20")}
            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
              activeContract === "ERC20"
                ? "border-[#ac1c5e] bg-[#ac1c5e]/10 shadow-lg shadow-[#ac1c5e]/25"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            {activeContract === "ERC20" && (
              <div className="absolute -top-3 -right-3 bg-[#ac1c5e] text-white px-3 py-1 rounded-full text-sm font-medium">
                Selected
              </div>
            )}
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${
                activeContract === "ERC20" ? "bg-[#ac1c5e]/20" : "bg-gray-800"
              }`}>
                <Coins className={`w-12 h-12 ${
                  activeContract === "ERC20" ? "text-[#ac1c5e]" : "text-gray-400"
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-white">ERC20</h3>
              <p className="text-gray-400">Fungible Token Standard</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Token transfers</li>
                <li>• Balance tracking</li>
                <li>• Allowances</li>
              </ul>
            </div>
          </button>

          {/* ERC721 Card */}
          <button
            onClick={() => setActiveContract("ERC721")}
            className={`relative p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
              activeContract === "ERC721"
                ? "border-[#ac1c5e] bg-[#ac1c5e]/10 shadow-lg shadow-[#ac1c5e]/25"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            {activeContract === "ERC721" && (
              <div className="absolute -top-3 -right-3 bg-[#ac1c5e] text-white px-3 py-1 rounded-full text-sm font-medium">
                Selected
              </div>
            )}
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${
                activeContract === "ERC721" ? "bg-[#ac1c5e]/20" : "bg-gray-800"
              }`}>
                <Code2 className={`w-12 h-12 ${
                  activeContract === "ERC721" ? "text-[#ac1c5e]" : "text-gray-400"
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-white">ERC721</h3>
              <p className="text-gray-400">Non-Fungible Token (NFT)</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Unique tokens</li>
                <li>• Ownership tracking</li>
                <li>• Metadata support</li>
              </ul>
            </div>
          </button>
        </div>

        <div className="mt-12 inline-flex items-center px-6 py-3 bg-gray-800/50 border border-gray-700 rounded-full">
          <div className="w-2 h-2 bg-[#ac1c5e] rounded-full animate-pulse mr-3"></div>
          <span className="text-gray-400">
            Currently exploring: <span className="text-[#ac1c5e] font-medium">{activeContract}</span>
          </span>
        </div>
      </div>
    </section>
  )
} 