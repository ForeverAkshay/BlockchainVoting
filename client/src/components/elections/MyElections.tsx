import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, apiGet } from "@/lib/queryClient";
import { useWeb3 } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Election } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MyElections() {
  const { address, isConnected } = useWeb3();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const { data: elections, isLoading } = useQuery({
    queryKey: [`/api/elections/creator/${address}`],
    queryFn: async () => {
      return await apiGet<Election[]>(`/api/elections/creator/${address}`);
    },
    enabled: isConnected && !!address
  });

  // Mutation for deleting an election
  const deleteElectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/elections/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/elections/creator/${address}`] });
      toast({
        title: "Election deleted",
        description: "The election has been successfully deleted",
      });
      setShowConfirmDelete(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete election",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleViewResults = (election: Election) => {
    setLocation(`/results?id=${election.id}`);
  };

  const handleDeleteClick = (election: Election) => {
    setSelectedElection(election);
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (selectedElection) {
      deleteElectionMutation.mutate(selectedElection.id);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">Connect your wallet</h3>
        <p className="mt-1 text-sm text-gray-500">You need to connect your wallet to view your elections.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-800">My Created Elections</h2>
          <Button 
            className="bg-primary text-white hover:bg-primary/90 flex items-center"
            onClick={() => {
              const tabCreateElection = document.getElementById("tabCreateElection");
              if (tabCreateElection) {
                (tabCreateElection as HTMLButtonElement).click();
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Election
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-500">Loading your elections...</p>
          </div>
        ) : !elections || elections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't created any elections yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voters</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {elections.map((election: Election) => {
                  const now = new Date();
                  const startDate = new Date(election.startDate);
                  const endDate = new Date(election.endDate);
                  const isActive = startDate <= now && endDate >= now;
                  const isCompleted = endDate < now;
                  const isPending = startDate > now;
                  
                  return (
                    <tr key={election.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{election.title}</div>
                        <div className="text-xs text-gray-500">Created on {election.createdAt ? format(new Date(election.createdAt), "MMM d, yyyy") : "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isActive && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            Completed
                          </Badge>
                        )}
                        {isPending && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(election.startDate), "MMM d")} - {format(new Date(election.endDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* This would be fetched from the contract */}
                        --
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewResults(election)}
                            className="text-[#00ACC1] hover:text-[#007C91]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={isCompleted}
                            className={`text-gray-500 hover:text-gray-700 ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteClick(election)}
                            disabled={isActive || isCompleted}
                            className={`text-red-500 hover:text-red-700 ${(isActive || isCompleted) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Contract Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Smart Contract Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Contract Address</h4>
            <div className="flex items-center">
              <code className="bg-white px-3 py-1 rounded text-sm text-gray-800 border border-gray-200 flex-grow overflow-x-auto">
                {import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 text-primary"
                onClick={() => {
                  navigator.clipboard.writeText(import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3");
                  toast({
                    title: "Copied to clipboard",
                    description: "Contract address copied to clipboard",
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Network</h4>
            <div className="flex items-center">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-gray-800">Sepolia Testnet</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Election</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this election? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteElectionMutation.isPending}
            >
              {deleteElectionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
}
