import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/lib/web3";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WalletConnector() {
  const { isConnected, isConnecting, connect, disconnect, address, chainId } = useWeb3();
  
  const formatAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };
  
  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return "Disconnected";
    if (chainId === 11155111) return "Sepolia Testnet";
    return "Unknown Network";
  };
  
  return (
    <div>
      {isConnected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-green-500 text-green-700 px-4">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              {formatAddress(address)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-gray-500 cursor-default">
              {getNetworkName(chainId)}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={disconnect}>
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          variant="outline" 
          onClick={connect}
          disabled={isConnecting}
          className="px-4"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              Connect Wallet
            </>
          )}
        </Button>
      )}
    </div>
  );
}