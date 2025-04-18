import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWeb3 } from "@/lib/web3";
import { getVotingContract } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import TransactionModal from "../modals/TransactionModal";
import { useWebSocket } from "@/lib/websocket";

// Simple schema for form validation
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  date: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  isPublic: z.boolean()
});

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
  const { sendMessage } = useWebSocket();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      isPublic: true
    }
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating election with data:", data);
      
      // Validate required fields
      const missingFields = [];
      if (!data.title) missingFields.push("title");
      if (!data.description) missingFields.push("description");
      if (!data.startDate) missingFields.push("start date");
      if (!data.endDate) missingFields.push("end date");
      if (!data.options || data.options.length < 2) missingFields.push("candidates (at least 2)");
      if (!data.creatorAddress) missingFields.push("wallet address");
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }
      
      // First create the election in the database
      const response = await fetch("/api/elections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create election");
      }
      
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log("Election created in database:", data);
      try {
        await createBlockchainElection(data);
      } catch (error) {
        console.error("Error in blockchain election creation:", error);
        // Ensure mutation is reset even if blockchain fails
        createElectionMutation.reset();
      } finally {
        queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
      }
    },
    onError: (error: any) => {
      console.error("Failed to create election:", error);
      toast({
        title: "Election creation failed",
        description: error.message || "Could not create the election",
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

      // Check if wallet is properly connected and authorized
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error("User denied account access:", error);
        setTxStatus("error");
        toast({
          title: "Wallet authorization failed",
          description: "Please connect and authorize your wallet to create an election",
          variant: "destructive"
        });
        return;
      }

      const contract = getVotingContract(signer);
      
      // Get timestamps for blockchain (ensure we're using proper millisecond timestamps)
      console.log("Date validation for blockchain:", {
        startDateRaw: electionData.startDate,
        endDateRaw: electionData.endDate,
        startDateParsed: new Date(electionData.startDate).toString(),
        endDateParsed: new Date(electionData.endDate).toString()
      });
      
      const startTime = Math.floor(new Date(electionData.startDate).getTime() / 1000);
      const endTime = Math.floor(new Date(electionData.endDate).getTime() / 1000);
      const candidateNames = electionData.options.map((option: any) => option.name);
      const candidateDescriptions = electionData.options.map((option: any) => option.description || "");
      
      console.log("Creating blockchain election with data:", {
        title: electionData.title,
        description: electionData.description,
        startTime,
        endTime,
        isPublic: electionData.isPublic,
        candidateNames,
        candidateDescriptions
      });
      
      // Ask the user to confirm by showing clear instructions
      toast({
        title: "Confirm transaction in MetaMask",
        description: "Please check your MetaMask wallet and confirm the transaction",
      });
      
      // First attempt to estimate gas to catch errors early
      try {
        await contract.createElection.estimateGas(
          electionData.title,
          electionData.description,
          startTime,
          endTime,
          electionData.isPublic,
          candidateNames,
          candidateDescriptions
        );
      } catch (estimateError: any) {
        console.error("Gas estimation failed:", estimateError);
        setTxStatus("error");
        
        // Handle common contract errors
        let errorMessage = "Smart contract transaction would fail - try again later or with different parameters";
        if (estimateError.reason) {
          errorMessage = `Contract error: ${estimateError.reason}`;
        }
        
        toast({
          title: "Transaction would fail",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Delete the created election from the database since blockchain deployment failed
        try {
          await apiRequest("DELETE", `/api/elections/${electionData.id}`, undefined);
        } catch (deleteError) {
          console.error("Failed to delete election after failed blockchain transaction:", deleteError);
        }
        
        return;
      }
      
      // Add a timeout for the transaction to prevent hanging
      let timeoutId: any = null;
      const transactionPromise = contract.createElection(
        electionData.title,
        electionData.description,
        startTime,
        endTime,
        electionData.isPublic,
        candidateNames,
        candidateDescriptions,
        { gasLimit: 3000000 } // Set a higher gas limit to ensure transaction goes through
      );
      
      // Set a 60-second timeout to abort if transaction is taking too long
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Transaction timed out. Please try again."));
        }, 60000); // 60 seconds
      });
      
      // Race between the transaction and timeout
      const tx = await Promise.race([transactionPromise, timeoutPromise]) as any;
      
      // Clear timeout if transaction completed
      if (timeoutId) clearTimeout(timeoutId);
      
      setTxHash(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      // Update the election status in the database
      await apiRequest("PUT", `/api/elections/${electionData.id}/status`, {
        status: "active",
        contractAddress: import.meta.env.VITE_VOTING_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        transactionHash: tx.hash
      });
      
      // Send websocket notification about new election
      sendMessage({
        type: 'election_created',
        electionId: electionData.id,
        transactionHash: tx.hash,
        message: `New election "${electionData.title}" created`
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
    } catch (error: any) {
      console.error("Failed to create election on blockchain:", error);
      setTxStatus("error");
      
      // Extract the specific error message for user feedback
      let errorMessage = "Failed to create election on the blockchain";
      
      if (error.code === 4001) {
        errorMessage = "Transaction was rejected by the user";
      } else if (error.code === 4100) {
        errorMessage = "The requested account has not been authorized";
      } else if (error.code === "CALL_EXCEPTION") {
        errorMessage = "Transaction failed - the smart contract rejected the operation";
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Delete the created election from the database since blockchain deployment failed
      try {
        await apiRequest("DELETE", `/api/elections/${electionData.id}`, undefined);
      } catch (deleteError) {
        console.error("Failed to delete election after failed blockchain transaction:", deleteError);
      }
    }
  };

  const onSubmit = (data: any) => {
    try {
      // Validate that all candidates have names
      if (candidates.some(c => !c.name.trim())) {
        toast({
          title: "Invalid candidate names",
          description: "All candidates must have names",
          variant: "destructive"
        });
        return;
      }
      
      // Parse date and times
      const [year, month, day] = data.date.split('-').map(Number);
      
      // Start time
      const [startHour, startMinute] = data.startTime.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      
      // End time
      const [endHour, endMinute] = data.endTime.split(':').map(Number);
      const endDate = new Date(year, month - 1, day, endHour, endMinute);
      
      // Validation
      const now = new Date();
      
      // Add a small buffer (2 seconds) to account for time taken to fill the form
      const bufferedNow = new Date(now.getTime() + 2000);
      
      console.log("Time validation:", {
        startDateStr: startDate.toString(),
        nowStr: now.toString(),
        startTime: startDate.getTime(),
        nowTime: now.getTime(),
        isStartInFuture: startDate.getTime() > now.getTime()
      });
      
      if (startDate.getTime() <= bufferedNow.getTime()) {
        toast({
          title: "Invalid start time",
          description: "Start time must be in the future",
          variant: "destructive"
        });
        return;
      }
      
      if (endDate <= startDate) {
        toast({
          title: "Invalid end time",
          description: "End time must be after start time",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare submission data
      const formData = {
        title: data.title,
        description: data.description,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isPublic: data.isPublic,
        options: candidates.map(c => ({
          id: c.id,
          name: c.name.trim(),
          description: c.description.trim() || ""
        })),
        creatorAddress: address || ""
      };
      
      console.log("Submitting election data:", formData);
      
      // Submit to API
      createElectionMutation.mutate(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error submitting form",
        description: "Please check your form inputs and try again",
        variant: "destructive"
      });
    }
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
            
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Election Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        The date on which this election will be held
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        The time when voting begins (must be in the future)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        The time when voting closes (must be after start time)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                  <FormDescription className="text-xs">
                    Choose who can vote in this election
                  </FormDescription>
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
            setTxHash("");
            createElectionMutation.reset();
          } else {
            // If it's pending for more than 60 seconds, allow user to close
            toast({
              title: "Transaction may be delayed",
              description: "The transaction might continue in the background. You can check your wallet for updates.",
              duration: 5000,
            });
            setShowTxModal(false);
            setTxStatus("error");
            createElectionMutation.reset();
          }
        }}
        status={txStatus}
        txHash={txHash}
        onRetry={() => {
          createElectionMutation.reset();
          setTimeout(() => {
            createElectionMutation.mutate(form.getValues());
          }, 100);
        }}
      />
    </>
  );
}