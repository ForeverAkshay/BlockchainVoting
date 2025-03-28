import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "pending" | "success" | "error";
  txHash?: string;
  onRetry?: () => void;
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  status, 
  txHash, 
  onRetry 
}: TransactionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === "pending" && "Transaction Processing"}
            {status === "success" && "Transaction Successful"}
            {status === "error" && "Transaction Failed"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          {status === "pending" && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 relative mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
              </div>
              <h3 className="text-lg font-medium mb-2">Processing Transaction</h3>
              <p className="text-sm text-gray-500 text-center">
                Your transaction is being processed on the blockchain. This may take a few moments.
              </p>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Transaction Completed</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Your transaction has been successfully processed on the blockchain.
              </p>
              {txHash && (
                <div className="bg-gray-50 p-3 rounded-md w-full overflow-hidden">
                  <p className="text-xs font-medium text-gray-600 mb-1">Transaction Hash:</p>
                  <p className="text-xs text-gray-500 truncate">{txHash}</p>
                </div>
              )}
            </div>
          )}
          
          {status === "error" && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Transaction Failed</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Your transaction could not be processed. This could be due to network congestion or insufficient gas.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          {status === "error" && onRetry && (
            <Button onClick={onRetry} className="w-full">
              Retry Transaction
            </Button>
          )}
          <Button 
            variant={status === "error" ? "outline" : "default"} 
            onClick={onClose} 
            className="w-full"
          >
            {status === "pending" ? "Close (Still Processing)" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}