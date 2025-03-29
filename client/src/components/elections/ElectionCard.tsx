import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/lib/web3";
import { ethers } from "ethers";
import { getVotingContract } from "@/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Election } from "@shared/schema";

interface ElectionCardProps {
  election: Election;
  onVoteClick?: () => void;
  onResultClick?: () => void;
  isActive: boolean;
}

export default function ElectionCard({ election, onVoteClick, onResultClick, isActive }: ElectionCardProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [voterCount, setVoterCount] = useState(0);
  const { address, provider } = useWeb3();

  // Check if the user has voted
  useEffect(() => {
    const checkVotingStatus = async () => {
      if (!address || !election) return;
      
      try {
        // First check on-chain if contract is deployed
        if (provider && election.contractAddress) {
          try {
            const contract = getVotingContract(provider);
            const voted = await contract.hasVoted(election.id, address);
            setHasVoted(voted);
            
            // Get election data from blockchain
            const electionData = await contract.getElectionSummary(election.id);
            setVoterCount(Number(electionData.totalVotes));
            
            // If we got the blockchain data successfully, return early
            if (voted) {
              console.log(`User ${address} has already voted for election ${election.id} (verified on blockchain)`);
              return;
            }
          } catch (contractError) {
            console.error("Failed to check voting status on blockchain:", contractError);
            // Continue to API check if blockchain check fails
          }
        }
        
        // Fallback to API check
        try {
          const res = await apiRequest("GET", `/api/votes/check?electionId=${election.id}&voterAddress=${address}`);
          const data = await res.json();
          
          if (data.hasVoted) {
            console.log(`User ${address} has already voted for election ${election.id} (verified in database)`);
            setHasVoted(true);
          }
        } catch (apiError) {
          console.error("Failed to check voting status via API:", apiError);
        }
      } catch (error) {
        console.error("Failed to check voting status:", error);
      }
    };

    if (address) {
      checkVotingStatus();
    }
  }, [provider, address, election]);

  // Format dates for display
  const formattedEndDate = election.endDate 
    ? format(new Date(election.endDate), "MMM d, yyyy")
    : "Unknown";

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg text-gray-800">{election.title}</h3>
          <p className="text-gray-500 text-sm mt-1">{election.description}</p>
          
          <div className="flex items-center mt-3">
            <div className="flex items-center mr-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500">
                {isActive ? `Ends on ${formattedEndDate}` : `Ended on ${formattedEndDate}`}
              </span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-gray-500">{voterCount.toLocaleString()} voters</span>
            </div>
          </div>
        </div>
        
        {isActive ? (
          hasVoted ? (
            <div className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-500">
              Already Voted
            </div>
          ) : (
            <Button
              onClick={onVoteClick}
              className="bg-primary text-white hover:bg-primary-dark"
            >
              Vote Now
            </Button>
          )
        ) : (
          <Button
            onClick={onResultClick}
            className="bg-[#00ACC1] text-white hover:bg-[#007C91]"
          >
            View Results
          </Button>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-500 mr-2">Status:</span>
          {isActive ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
              Completed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
