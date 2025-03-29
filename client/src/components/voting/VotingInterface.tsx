import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Election } from "@shared/schema";
import { useWeb3, getVotingContract } from "@/lib/web3";
import TransactionModal from "@/components/modals/TransactionModal";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";

interface VotingInterfaceProps {
  election: Election;
  isOpen: boolean;
  onClose: () => void;
}

export default function VotingInterface({ election, isOpen, onClose }: VotingInterfaceProps) {
  const { toast } = useToast();
  const { signer, address, provider } = useWeb3();
  const { sendMessage } = useWebSocket();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error">("pending");
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  
  // Check if user has already voted
  useEffect(() => {
    if (!isOpen || !address || !election) return;
    
    const checkVoteStatus = async () => {
      try {
        // Check on the blockchain first
        if (provider) {
          try {
            const contract = getVotingContract(provider);
            const voted = await contract.hasVoted(election.id, address);
            if (voted) {
              setHasVoted(true);
              return;
            }
          } catch (e) {
            console.error("Failed to check vote status on blockchain:", e);
            // Continue to check database if blockchain check fails
          }
        }
        
        // Then check in our database
        const response = await apiRequest("GET", `/api/votes/check?electionId=${election.id}&voterAddress=${address}`);
        const data = await response.json();
        setHasVoted(data.hasVoted);
      } catch (error) {
        console.error("Failed to check vote status:", error);
        toast({
          title: "Error",
          description: "Failed to check if you have already voted in this election.",
          variant: "destructive",
        });
      }
    };
    
    checkVoteStatus();
  }, [isOpen, address, election, provider, toast]);
  
  const handleSubmitVote = async () => {
    if (!selectedCandidate && selectedCandidate !== 0) {
      toast({
        title: "Selection Required",
        description: "Please select a candidate to vote for",
        variant: "destructive",
      });
      return;
    }
    
    if (!signer || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return;
    }
    
    // We'll proceed even without contractAddress since we're using the global contract address from environment variables
    
    setIsSubmitting(true);
    setTxModalOpen(true);
    setTxStatus("pending");
    
    try {
      // First request explicit permission from MetaMask
      toast({
        title: "Wallet authorization required",
        description: "Please check your MetaMask and approve the connection request",
      });
      
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error("User denied account access:", error);
        setTxStatus("error");
        toast({
          title: "Wallet authorization failed",
          description: "Please approve MetaMask connection to continue with voting",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Get contract with signer to send transactions
      const contract = getVotingContract(signer);
      
      // First verify with the database that the user hasn't voted already
      const voteCheckResponse = await apiRequest("GET", `/api/votes/check?electionId=${election.id}&voterAddress=${address}`);
      const voteCheckData = await voteCheckResponse.json();
      
      if (voteCheckData.hasVoted) {
        setTxStatus("error");
        toast({
          title: "Already Voted",
          description: "You have already voted in this election",
          variant: "destructive",
        });
        setHasVoted(true);
        return;
      }
      
      // Send transaction to vote
      const tx = await contract.vote(election.id, selectedCandidate);
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Transaction successful
        setTxStatus("success");
        
        // Record vote in the database
        await apiRequest("POST", "/api/votes", {
          electionId: election.id,
          voterAddress: address,
          optionId: selectedCandidate, // Changed from candidateId to optionId to match schema
          transactionHash: tx.hash
        });
        
        // Send WebSocket notification about the vote
        sendMessage({
          type: 'vote',
          electionId: election.id,
          candidateId: selectedCandidate,
          transactionHash: tx.hash,
          message: `Vote cast for candidate "${election.options[selectedCandidate].name}" in election "${election.title}"`
        });
        
        setHasVoted(true);
        
        toast({
          title: "Vote Submitted",
          description: "Your vote has been recorded successfully on the blockchain!",
        });
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
      setTxStatus("error");
      
      toast({
        title: "Vote Failed",
        description: "Failed to record your vote on the blockchain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRetry = () => {
    setTxStatus("pending");
    handleSubmitVote();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vote in Election</DialogTitle>
            <DialogDescription>
              {election.title}
            </DialogDescription>
          </DialogHeader>
          
          {hasVoted ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vote Recorded</h3>
              <p className="text-gray-500">
                You have already voted in this election. Thank you for participating!
              </p>
            </div>
          ) : (
            <>
              <div className="py-4">
                <h3 className="text-sm font-medium mb-3">Select a candidate to vote for:</h3>
                <RadioGroup value={selectedCandidate?.toString()} onValueChange={(val) => setSelectedCandidate(parseInt(val))}>
                  <div className="space-y-3">
                    {election.options.map((option, index) => (
                      <Card key={option.id || index} className={selectedCandidate === index ? "border-primary" : ""}>
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value={index.toString()} id={`candidate-${index}`} className="mt-1" />
                            <div className="grid gap-1.5">
                              <Label htmlFor={`candidate-${index}`} className="font-medium">
                                {option.name}
                              </Label>
                              <p className="text-sm text-gray-500">
                                {option.description || "No description provided"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
              </div>
              
              <DialogFooter>
                <Button
                  onClick={handleSubmitVote}
                  disabled={isSubmitting || selectedCandidate === null}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Vote"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Transaction Status Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        status={txStatus}
        txHash={txHash}
        onRetry={handleRetry}
      />
    </>
  );
}