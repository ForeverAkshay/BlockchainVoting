import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWeb3 } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import ElectionList from "@/components/elections/ElectionList";
import AadharVerificationModal from "@/components/voter/AadharVerificationModal";

// A simulated database of valid Aadhar numbers
const VALID_AADHAR_NUMBERS = [
  "123456789012",
  "234567890123",
  "345678901234",
  "456789012345",
  "567890123456",
  "678901234567",
  "789012345678",
  "890123456789",
  "901234567890",
];

export default function VoterPage() {
  const [, navigate] = useLocation();
  const { isConnected, connect } = useWeb3();
  const { toast } = useToast();
  const [aadharNumber, setAadharNumber] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleVerify = () => {
    // Validate Aadhar format
    if (!/^\d{12}$/.test(aadharNumber)) {
      toast({
        title: "Invalid Aadhar Number",
        description: "Please enter a valid 12-digit Aadhar number",
        variant: "destructive",
      });
      return;
    }
    
    // Open the verification modal with animation
    setIsVerifyModalOpen(true);
  };
  
  const handleVerificationSuccess = () => {
    setIsVerified(true);
    setTimeout(() => {
      setIsVerifyModalOpen(false);
      toast({
        title: "Verification Successful",
        description: "Your Aadhar number has been successfully verified",
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Welcome
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Voter Interface</h1>
        
        {isVerified ? (
          <>
            <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-3">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div>
                <h3 className="font-medium text-green-800">Verification Complete</h3>
                <p className="text-green-700 text-sm">Your Aadhar has been verified. You can now vote in elections.</p>
              </div>
            </div>
            
            {!isConnected && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold mb-4">Connect Wallet to Vote</h2>
                <p className="text-gray-600 mb-4">Please connect your Ethereum wallet to participate in elections.</p>
                <Button 
                  onClick={() => connect()}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Connect Wallet
                </Button>
              </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Available Elections</h2>
              <ElectionList />
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-6">Voter Verification</h2>
            <p className="text-gray-600 mb-6">
              To participate in elections, you must first verify your identity using your Aadhar number.
            </p>
            
            <div className="mb-6">
              <Label htmlFor="aadhar" className="block mb-2">Enter your Aadhar Number</Label>
              <Input
                id="aadhar"
                type="text"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                placeholder="12-digit Aadhar Number"
                className="w-full"
                maxLength={12}
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleVerify}
                disabled={aadharNumber.length !== 12}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Verify Identity
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Test Aadhar Numbers</h3>
              <p className="text-xs text-gray-500">
                For testing purposes, you can use any of these Aadhar numbers: 123456789012, 234567890123, 345678901234
              </p>
            </div>
            
            {/* Verification Modal with Animation */}
            <AadharVerificationModal
              isOpen={isVerifyModalOpen}
              onClose={() => setIsVerifyModalOpen(false)}
              onVerified={handleVerificationSuccess}
              aadharNumber={aadharNumber}
            />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}