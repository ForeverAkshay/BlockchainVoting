import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWeb3 } from "@/lib/web3";

export default function Home() {
  const { connect, isConnected, isConnecting } = useWeb3();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Secure Voting on the Blockchain</h1>
              <p className="text-lg mb-8 text-gray-100">
                Create transparent and tamper-proof elections with BlockVote. 
                Powered by Ethereum smart contracts on the Sepolia testnet.
              </p>
              {isConnected ? (
                <Link href="/dashboard">
                  <a>
                    <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                      Go to Dashboard
                    </Button>
                  </a>
                </Link>
              ) : (
                <Button 
                  onClick={() => connect()}
                  disabled={isConnecting}
                  size="lg" 
                  className="bg-accent hover:bg-accent/90 text-white"
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
                    <>Connect Wallet & Start</>
                  )}
                </Button>
              )}
            </div>
            <div className="hidden md:flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                <path d="m9 12 2 2 4-4"></path>
                <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"></path>
                <path d="M22 19H2"></path>
              </svg>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose BlockVote?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Secure & Tamper-proof</h3>
              <p className="text-gray-600">
                All votes are recorded on the Ethereum blockchain, making them immutable and verifiable by anyone.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Transparent Process</h3>
              <p className="text-gray-600">
                Election results are calculated automatically and can be independently verified by all participants.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Quick & Easy</h3>
              <p className="text-gray-600">
                Create an election in minutes, invite voters, and get real-time results as votes are cast.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary text-white mx-auto mb-4">
                <span className="font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Connect Wallet</h3>
              <p className="text-gray-600 text-sm">
                Connect your Ethereum wallet to authenticate and interact with the blockchain.
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary text-white mx-auto mb-4">
                <span className="font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Create Election</h3>
              <p className="text-gray-600 text-sm">
                Set up your election with a title, description, options, and voting period.
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary text-white mx-auto mb-4">
                <span className="font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">Cast Votes</h3>
              <p className="text-gray-600 text-sm">
                Participants connect their wallets, select their preferred option, and submit their vote.
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary text-white mx-auto mb-4">
                <span className="font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">View Results</h3>
              <p className="text-gray-600 text-sm">
                When the election ends, view the results which are securely recorded on the blockchain.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/dashboard">
              <a>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Get Started Now
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-[#00ACC1] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to create your first blockchain election?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using BlockVote for secure, transparent, and efficient voting.
          </p>
          {isConnected ? (
            <Link href="/dashboard">
              <a>
                <Button size="lg" className="bg-white text-[#00ACC1] hover:bg-gray-100">
                  Go to Dashboard
                </Button>
              </a>
            </Link>
          ) : (
            <Button 
              onClick={() => connect()}
              disabled={isConnecting}
              size="lg" 
              className="bg-white text-[#00ACC1] hover:bg-gray-100"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet & Start"}
            </Button>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
