import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import WalletConnector from "@/components/wallet/WalletConnector";

export default function Header() {
  const [, navigate] = useLocation();
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div 
            className="font-bold text-xl cursor-pointer flex items-center" 
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              </svg>
            </div>
            <span className="text-gray-800">BlockVote</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/voter")}
              className="text-gray-600"
            >
              Voter Interface
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="text-gray-600"
            >
              Admin Dashboard
            </Button>
          </nav>
          
          <WalletConnector />
        </div>
      </div>
    </header>
  );
}