import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createElectionSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWeb3 } from "@/lib/web3";
import { getVotingContract } from "@/lib/web3";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import TransactionModal from "../modals/TransactionModal";

interface CreateElectionFormProps {
  onSuccess: () => void;
}

type CandidateOption = {
  id: number;
  name: string;
  description: string;
};

export default function CreateElectionForm({ onSuccess }: CreateElectionFormProps) {
  const [candidates, setCandidates] = useState<CandidateOption[]>([
    { id: 1, name: "", description: "" },
    { id: 2, name: "", description: "" }
  ]);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error">("pending");
  const [txHash, setTxHash] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { signer, address } = useWeb3();

  const form = useForm({
    resolver: zodResolver(createElectionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isPublic: true,
      options: candidates,
      creatorAddress: address || ""
    }
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the election in the database
      const apiResponse = await apiRequest("POST", "/api/elections", {
        ...data,
        creatorAddress: address
      });
      
      return await apiResponse.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      createBlockchainElection(data);
    },
    onError: (error) => {
      toast({
        title: "Failed to create election",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const createBlockchainElection = async (electionData: any) => {
    if (!signer || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an election",
        variant: "destructive"
      });
      return;
    }

    try {
      setShowTxModal(true);
      setTxStatus("pending");

      const contract = getVotingContract(signer);
      
      // Prepare data for the contract
      const startTime = Math.floor(new Date(electionData.startDate).getTime() / 1000);
      const endTime = Math.floor(new Date(electionData.endDate).getTime() / 1000);
      const candidateNames = electionData.options.map((option: any) => option.name);
      const candidateDescriptions = electionData.options.map((option: any) => option.description || "");
      
      // Create the election on the blockchain
      const tx = await contract.createElection(
        electionData.title,
        electionData.description,
        startTime,
        endTime,
        electionData.isPublic,
        candidateNames,
        candidateDescriptions
      );
      
      setTxHash(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      // Update the election status in the database
      await apiRequest("PUT", `/api/elections/${electionData.id}/status`, {
        status: "active",
        contractAddress: contract.address,
        transactionHash: tx.hash
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      
      setTxStatus("success");
      
      toast({
        title: "Election created successfully",
        description: "Your election has been created and deployed to the blockchain",
      });
      
      form.reset();
      
      // Call the success callback
      onSuccess();
    } catch (error) {
      console.error("Failed to create election on blockchain:", error);
      setTxStatus("error");
      
      toast({
        title: "Transaction failed",
        description: "Failed to create election on the blockchain",
        variant: "destructive"
      });
    }
  };

  const onSubmit = (data: any) => {
    // Convert string dates to Date objects
    const formData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      options: candidates,
      creatorAddress: address
    };
    
    createElectionMutation.mutate(formData);
  };

  const addOption = () => {
    setCandidates([...candidates, { id: candidates.length + 1, name: "", description: "" }]);
  };

  const removeOption = (id: number) => {
    if (candidates.length <= 2) {
      toast({
        title: "Cannot remove option",
        description: "At least two options are required",
        variant: "destructive"
      });
      return;
    }
    setCandidates(candidates.filter(c => c.id !== id));
  };

  const updateOption = (id: number, field: string, value: string) => {
    setCandidates(candidates.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-medium text-gray-800 mb-6">Create New Election</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Election Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter election title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter election description" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligible Voters</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex items-center space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="public" />
                        <Label htmlFor="public">Public (Anyone)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="registered" />
                        <Label htmlFor="registered">Registered Wallets Only</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Candidates/Options Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Candidates/Options</Label>
                <Button 
                  type="button" 
                  onClick={addOption}
                  variant="ghost" 
                  size="sm"
                  className="text-primary flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-3">
                {candidates.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Input 
                        placeholder={`Option ${option.id}`}
                        value={option.name}
                        onChange={(e) => updateOption(option.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input 
                        placeholder="Description (optional)"
                        value={option.description}
                        onChange={(e) => updateOption(option.id, "description", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      className="text-gray-400 hover:text-red-500"
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
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <Button 
                type="button" 
                variant="ghost"
                className="mr-4 text-gray-500"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary text-white hover:bg-primary/90"
                disabled={createElectionMutation.isPending}
              >
                {createElectionMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m9 12 2 2 4-4"></path>
                      <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"></path>
                      <path d="M22 19H2"></path>
                    </svg>
                    Create Election
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <TransactionModal
        isOpen={showTxModal}
        onClose={() => {
          if (txStatus !== "pending") {
            setShowTxModal(false);
          }
        }}
        status={txStatus}
        txHash={txHash}
        onRetry={() => createElectionMutation.mutate(form.getValues())}
      />
    </>
  );
}
