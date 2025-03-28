import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface AadharVerificationModalProps {
  isOpen: boolean;
  onVerified: () => void;
  onClose: () => void;
  aadharNumber: string;
}

// A simulated database of valid Aadhar numbers (this should match the list in voter.tsx)
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

export default function AadharVerificationModal({ isOpen, onVerified, onClose, aadharNumber }: AadharVerificationModalProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [message, setMessage] = useState("Verifying Aadhar details...");
  
  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setStatus("processing");
      setMessage("Verifying Aadhar details...");
    }
  }, [isOpen]);
  
  // Animation and verification logic
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + 10;
        
        // At 30%, check the fingerprint
        if (oldProgress < 30 && newProgress >= 30) {
          setMessage("Checking fingerprint records...");
        }
        
        // At 60%, verify identity
        if (oldProgress < 60 && newProgress >= 60) {
          setMessage("Validating identity...");
        }
        
        // At 90%, finalize
        if (oldProgress < 90 && newProgress >= 90) {
          setMessage("Finalizing verification...");
        }
        
        // At 100%, complete the verification
        if (newProgress >= 100) {
          clearInterval(timer);
          
          // Check if Aadhar is valid
          if (VALID_AADHAR_NUMBERS.includes(aadharNumber)) {
            setStatus("success");
            setMessage("Verification successful!");
            setTimeout(() => {
              onVerified();
            }, 1000);
          } else {
            setStatus("failed");
            setMessage("Verification failed. Invalid Aadhar number.");
            setTimeout(() => {
              onClose();
            }, 2000);
          }
          return 100;
        }
        
        return newProgress;
      });
    }, 300); // slightly slower for more dramatic effect
    
    return () => clearInterval(timer);
  }, [isOpen, aadharNumber, onVerified, onClose]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Aadhar Verification</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6">
          {status === "processing" && (
            <div className="animate-pulse w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M17 11v1a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-1" />
                <path d="M6 11V8a6 6 0 0 1 12 0v3" />
              </svg>
            </div>
          )}
          
          {status === "success" && (
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          )}
          
          {status === "failed" && (
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          )}
          
          <div className="text-lg font-medium text-center mb-4">
            {message}
          </div>
          
          {status === "processing" && (
            <div className="w-full max-w-sm">
              <Progress value={progress} className="h-2 mb-2" />
              <div className="text-sm text-gray-500 text-right">{progress}%</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}