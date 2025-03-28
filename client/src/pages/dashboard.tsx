import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { useWeb3 } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { isConnected, connect, isConnecting } = useWeb3();
  const [location, navigate] = useLocation();

  // If not connected and not connecting, show connect wallet prompt
  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <div className="text-center max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500 mb-6">
              To participate in elections or create your own, you need to connect your Ethereum wallet first.
            </p>
            <Button 
              onClick={() => connect()}
              disabled={isConnecting}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting Wallet...
                </>
              ) : (
                <>
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return <DashboardTabs />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      {renderContent()}
      <Footer />
    </div>
  );
}
