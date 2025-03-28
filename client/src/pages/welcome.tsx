import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Welcome() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            Welcome to BlockVote
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            A secure, transparent voting system built on the blockchain.
            Please select your role to continue.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Voter</h2>
              <p className="text-gray-500 mb-6 text-center">
                Register with your Aadhar number, connect your wallet, and cast your vote in active elections.
              </p>
              <Button 
                onClick={() => navigate("/voter")}
                className="bg-primary text-white hover:bg-primary/90 w-full"
              >
                Continue as Voter
              </Button>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
              <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
                  <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                  <path d="M12 8v4"></path>
                  <path d="M15.2 14c.8-.5 1.3-1.4 1.3-2.4 0-.3 0-.7-.1-1" opacity=".5"></path>
                  <path d="M6.8 12.4c0 .3 0 .7.1 1 .4 2 2.2 3.5 4.4 3.5 1.3 0 2.5-.6 3.3-1.5" opacity=".5"></path>
                  <path d="M17.8 15.2a8 8 0 0 0-11.8 0"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-gray-800">Admin</h2>
              <p className="text-gray-500 mb-6 text-center">
                Create elections, add candidates, manage voter registration, and view election results.
              </p>
              <Button 
                onClick={() => navigate("/admin")}
                className="bg-accent text-white hover:bg-accent/90 w-full"
              >
                Continue as Admin
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}