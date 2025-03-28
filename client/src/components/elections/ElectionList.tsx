import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Election } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import ResultsModal from "@/components/results/ResultsModal";
import VotingInterface from "@/components/voting/VotingInterface";

export default function ElectionList() {
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  
  // Query to get active elections
  const { data: activeElections, isLoading: isLoadingActive } = useQuery({
    queryKey: ['/api/elections/active'],
    queryFn: async () => {
      const response = await apiRequest('/api/elections?active=true');
      return response;
    }
  });
  
  // Query to get completed elections
  const { data: completedElections, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ['/api/elections/completed'],
    queryFn: async () => {
      const response = await apiRequest('/api/elections?active=false');
      return response;
    }
  });
  
  // Filter for active and completed elections
  const filteredActiveElections = activeElections ? 
    activeElections.filter((election: Election) => new Date(election.endDate) > new Date()) : 
    [];
  
  const filteredCompletedElections = completedElections ? 
    completedElections.filter((election: Election) => new Date(election.endDate) <= new Date()) : 
    [];
  
  // Handle voting interface
  const handleVoteClick = (election: Election) => {
    setSelectedElection(election);
    setIsVotingModalOpen(true);
  };
  
  // Handle results modal
  const handleViewResults = (election: Election) => {
    setSelectedElection(election);
    setIsResultsModalOpen(true);
  };
  
  // Function to determine if an election is active
  const isElectionActive = (election: Election) => {
    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    return now >= startDate && now <= endDate;
  };
  
  // Function to get vote count from options
  const getVoteCount = (election: Election) => {
    return election.options.reduce((sum, option) => sum + (option.voteCount || 0), 0);
  };
  
  return (
    <div className="space-y-8">
      {/* Loading states */}
      {(isLoadingActive || isLoadingCompleted) && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      )}
      
      {/* Active Elections */}
      {!isLoadingActive && filteredActiveElections.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Elections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActiveElections.map((election: Election) => (
              <Card key={election.id} className={isElectionActive(election) ? "border-green-500" : "border-yellow-500"}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{election.title}</CardTitle>
                    <Badge className={isElectionActive(election) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {isElectionActive(election) ? "Active" : "Upcoming"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {election.description ? (
                      <>
                        {election.description.substring(0, 100)}
                        {election.description.length > 100 ? "..." : ""}
                      </>
                    ) : "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Starts:</span> {new Date(election.startDate).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Ends:</span> {new Date(election.endDate).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Candidates:</span> {election.options.length}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    onClick={() => handleVoteClick(election)}
                    disabled={!isElectionActive(election)}
                    className="w-full"
                  >
                    {isElectionActive(election) ? "Vote Now" : "Coming Soon"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Elections */}
      {!isLoadingCompleted && filteredCompletedElections.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Completed Elections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCompletedElections.map((election: Election) => (
              <Card key={election.id} className="border-gray-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{election.title}</CardTitle>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                  <CardDescription>
                    {election.description ? (
                      <>
                        {election.description.substring(0, 100)}
                        {election.description.length > 100 ? "..." : ""}
                      </>
                    ) : "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Ended:</span> {new Date(election.endDate).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Total Votes:</span> {getVoteCount(election) || "Results pending"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleViewResults(election)}
                    className="w-full"
                  >
                    View Results
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* No elections message */}
      {!isLoadingActive && !isLoadingCompleted && 
       filteredActiveElections.length === 0 && 
       filteredCompletedElections.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mx-auto mb-4">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-600">No Elections Available</h3>
          <p className="text-gray-500 mt-2">
            There are no active or completed elections at this time.
          </p>
        </div>
      )}
      
      {/* Modals */}
      {selectedElection && (
        <>
          <VotingInterface
            election={selectedElection}
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
          />
          
          <ResultsModal
            election={selectedElection}
            isOpen={isResultsModalOpen}
            onClose={() => setIsResultsModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}