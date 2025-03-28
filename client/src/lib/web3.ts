import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  network: ethers.Network | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  address: null,
  network: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export const useWeb3 = () => useContext(Web3Context);

const SEPOLIA_CHAIN_ID = 11155111;

export function Web3Provider({ children }: { children: ReactNode }): JSX.Element {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<ethers.Network | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Initialize provider from window.ethereum
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        try {
          // Get current network
          const network = await provider.getNetwork();
          setNetwork(network);
          setChainId(Number(network.chainId));
        } catch (error) {
          console.error("Failed to get network:", error);
        }
      }
    };

    initProvider();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect();
      } else if (accounts[0] !== address) {
        // User switched accounts
        setAddress(accounts[0]);
        toast({
          title: "Account changed",
          description: `Connected to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        });
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [address, toast]);

  // Connect wallet function
  const connect = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask or another compatible wallet",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length === 0) throw new Error("No accounts found");

      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if on Sepolia
      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          // Request chain switch to Sepolia
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
          });
          
          // Refresh network info
          const updatedNetwork = await provider.getNetwork();
          setNetwork(updatedNetwork);
          setChainId(Number(updatedNetwork.chainId));
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                    chainName: "Sepolia Test Network",
                    nativeCurrency: {
                      name: "Sepolia ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://ethereum-sepolia.blockpi.network/v1/rpc/public"],
                    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                  },
                ],
              });
              
              // Refresh network info
              const updatedNetwork = await provider.getNetwork();
              setNetwork(updatedNetwork);
              setChainId(Number(updatedNetwork.chainId));
            } catch (addError) {
              console.error("Failed to add Sepolia network", addError);
              toast({
                title: "Network Error",
                description: "Failed to add Sepolia network. Please add it manually in your wallet.",
                variant: "destructive",
              });
            }
          } else {
            console.error("Failed to switch network", switchError);
            toast({
              title: "Network Error",
              description: "Failed to switch to Sepolia network",
              variant: "destructive",
            });
          }
        }
      }

      setAddress(accounts[0]);
      setSigner(signer);
      setNetwork(network);
      setIsConnected(true);

      toast({
        title: "Wallet connected",
        description: `Connected to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setNetwork(null);
    setChainId(null);
    setIsConnected(false);
    
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const contextValue = {
    provider,
    signer,
    address,
    network,
    chainId,
    isConnected,
    isConnecting,
    connect,
    disconnect
  };
  
  return React.createElement(
    Web3Context.Provider,
    { value: contextValue },
    children
  );
}

// Smart contract interaction helper
export const VotingSystemABI = [
  "function createElection(string memory _title, string memory _description, uint256 _startTime, uint256 _endTime, bool _isPublic, string[] memory _candidateNames, string[] memory _candidateDescriptions) public returns (uint256)",
  "function registerVoter(uint256 _electionId, address _voter) public",
  "function registerVoters(uint256 _electionId, address[] memory _voters) public",
  "function vote(uint256 _electionId, uint256 _candidateId) public",
  "function hasVoted(uint256 _electionId, address _voter) public view returns (bool)",
  "function getElectionSummary(uint256 _electionId) public view returns (tuple(uint256 id, string title, string description, uint256 startTime, uint256 endTime, address creator, bool isPublic, uint256 candidateCount, uint256 totalVotes, bool initialized))",
  "function getCandidate(uint256 _electionId, uint256 _candidateId) public view returns (tuple(uint256 id, string name, string description, uint256 voteCount))",
  "function getAllCandidates(uint256 _electionId) public view returns (tuple(uint256 id, string name, string description, uint256 voteCount)[])",
  "function getAllElectionIds() public view returns (uint256[])",
  "function isVoterRegistered(uint256 _electionId, address _voter) public view returns (bool)",
  "event ElectionCreated(uint256 indexed electionId, address indexed creator)",
  "event VoterRegistered(uint256 indexed electionId, address indexed voter)",
  "event Voted(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId)",
  "event ElectionEnded(uint256 indexed electionId)"
];

// Contract address will be set after deployment
export const VOTING_CONTRACT_ADDRESS = import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Helper to get contract instance
export const getVotingContract = (providerOrSigner: ethers.BrowserProvider | ethers.JsonRpcSigner) => {
  return new ethers.Contract(VOTING_CONTRACT_ADDRESS, VotingSystemABI, providerOrSigner);
};