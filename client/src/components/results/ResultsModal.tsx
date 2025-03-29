import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Election } from "@shared/schema";
import { useWeb3 } from "@/lib/web3";

interface ResultsModalProps {
  election: Election;
  isOpen: boolean;
  onClose: () => void;
}

interface CandidateResult {
  id: number;
  name: string;
  description?: string;
  voteCount: number;
  percentage: number;
  isWinner?: boolean;
}

export default function ResultsModal({ election, isOpen, onClose }: ResultsModalProps) {
  const { provider, signer } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<CandidateResult[]>([]);
  
  // Fetch election results from blockchain or API
  useEffect(() => {
    if (!isOpen || !election) return;
    
    const fetchResults = async () => {
      setIsLoading(true);
      
      try {
        // Fetch real votes from the API
        const response = await fetch(`/api/votes/election/${election.id}`);
        const votes = await response.json();
        
        // Count votes for each option
        const voteCounts = new Map<number, number>();
        
        // Initialize all options with 0 votes
        election.options.forEach((option) => {
          voteCounts.set(option.id, 0);
        });
        
        // Count actual votes
        votes.forEach((vote: any) => {
          const optionId = vote.optionId;
          const currentCount = voteCounts.get(optionId) || 0;
          voteCounts.set(optionId, currentCount + 1);
        });
        
        // Create results with actual vote counts
        const realResults = election.options.map((option, index) => ({
          id: option.id || index,
          name: option.name,
          description: option.description,
          voteCount: voteCounts.get(option.id) || 0,
          percentage: 0 // Will be calculated below
        }));
        
        // Calculate percentages
        const totalVotes = realResults.reduce((sum: number, candidate: CandidateResult) => sum + candidate.voteCount, 0);
        const resultsWithPercentages = realResults.map((result: CandidateResult) => ({
          ...result,
          percentage: totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0
        }));
        
        // Sort by vote count (descending)
        const sortedResults = resultsWithPercentages.sort((a: CandidateResult, b: CandidateResult) => b.voteCount - a.voteCount);
        
        // Add visual enhancements for the winner if there are votes
        const enhancedResults = sortedResults.map((result: CandidateResult) => {
          const isWinner = totalVotes > 0 && result.voteCount > 0 && 
                          result.voteCount === Math.max(...resultsWithPercentages.map((r: CandidateResult) => r.voteCount));
          return {
            ...result,
            isWinner
          };
        });
        
        setResults(enhancedResults);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch election results:", error);
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [isOpen, election, provider, signer]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Election Results</DialogTitle>
          <DialogDescription>
            {election.title} - Final Results
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-5 w-5 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                  </svg>
                </div>
                <span>Loading results...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {results.map((candidate) => (
                <div key={candidate.id} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="font-medium flex items-center">
                      {candidate.name}
                      {candidate.isWinner && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Winner
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidate.voteCount} votes ({candidate.percentage.toFixed(1)}%)
                    </div>
                  </div>
                  
                  <Progress
                    value={candidate.percentage}
                    className={candidate.isWinner ? 'bg-green-100' : 'bg-gray-100'}
                  />
                  
                  <div className="text-sm text-gray-600">
                    {candidate.description || "No description provided"}
                  </div>
                </div>
              ))}
              
              <div className="pt-2 border-t text-sm text-gray-500">
                Total Votes: {results.reduce((sum, candidate) => sum + candidate.voteCount, 0)}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}