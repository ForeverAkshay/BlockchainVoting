import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWeb3 } from "@/lib/web3";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateElectionForm from "@/components/elections/CreateElectionForm";
import MyElections from "@/components/elections/MyElections";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { isConnected, connect } = useWeb3();
  
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
        
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
        
        {!isConnected ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              To manage elections and view results, you need to connect your Ethereum wallet first.
            </p>
            <Button 
              onClick={() => connect()}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Tabs defaultValue="create" className="p-6">
              <TabsList className="mb-6">
                <TabsTrigger value="create">Create Election</TabsTrigger>
                <TabsTrigger value="manage">Manage Elections</TabsTrigger>
              </TabsList>
              
              <TabsContent value="create">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Election</h2>
                  <p className="text-gray-600 mb-4">
                    Fill out the form below to create a new election. Add candidates, set the voting period, and deploy to the blockchain.
                  </p>
                </div>
                <CreateElectionForm onSuccess={() => {}} />
              </TabsContent>
              
              <TabsContent value="manage">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Your Elections</h2>
                  <p className="text-gray-600 mb-4">
                    View, manage, and check results for all the elections you've created.
                  </p>
                </div>
                <MyElections />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}