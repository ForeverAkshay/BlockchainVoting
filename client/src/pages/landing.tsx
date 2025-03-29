import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CheckCircle, Lock, ShieldCheck, LineChart, Zap, Globe } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-32 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary.50),transparent_70%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 px-3 py-1 text-sm bg-white bg-opacity-80 backdrop-blur-sm">
              Next Generation Electoral System
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-600">
              BlockVote: Revolutionizing Democracy
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed">
              A secure, transparent, and immutable voting platform built on blockchain technology, 
              designed to transform how we conduct elections in the digital age.
            </p>
            <Button 
              onClick={() => navigate("/welcome")}
              size="lg"
              className="px-8 py-6 text-lg font-medium rounded-lg transition-all bg-primary hover:bg-primary/90 hover:shadow-lg"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Blockchain Voting Is Better
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform addresses the key limitations of traditional voting systems, providing 
              solutions that ensure integrity, accessibility, and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Security */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Enhanced Security</h3>
              <p className="text-gray-600">
                Blockchain's cryptographic foundation ensures votes cannot be altered or deleted once recorded, 
                protecting against fraud and tampering attempts that plague traditional systems.
              </p>
            </div>

            {/* Transparency */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Complete Transparency</h3>
              <p className="text-gray-600">
                All voting transactions are publicly verifiable on the blockchain, creating an 
                immutable audit trail while maintaining voter privacy through advanced cryptography.
              </p>
            </div>

            {/* Real-time Results */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6">
                <LineChart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Real-time Results</h3>
              <p className="text-gray-600">
                Elections results can be calculated and verified instantly once voting concludes, 
                eliminating counting delays and reducing the cost of traditional electoral processes.
              </p>
            </div>

            {/* Accessibility */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Universal Accessibility</h3>
              <p className="text-gray-600">
                Voters can participate from anywhere with an internet connection, increasing turnout 
                and making democracy more inclusive for citizens with mobility limitations.
              </p>
            </div>

            {/* No Double Voting */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6">
                <CheckCircle className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Eliminated Double Voting</h3>
              <p className="text-gray-600">
                Our system mathematically guarantees that each eligible voter can cast exactly one vote, 
                preventing duplicate voting while preserving anonymity.
              </p>
            </div>

            {/* Cost Efficiency */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="rounded-full w-14 h-14 flex items-center justify-center bg-primary/10 mb-6">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Cost Efficiency</h3>
              <p className="text-gray-600">
                Blockchain voting significantly reduces the operational costs associated with traditional elections,
                from staffing polling stations to counting and verifying paper ballots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How BlockVote Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines the security of blockchain technology with an intuitive user experience
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Identity Verification</h3>
                <p className="text-gray-600">Secure verification using your Aadhar number ensures only eligible voters participate</p>
              </div>
              
              <div className="text-center">
                <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Wallet Connection</h3>
                <p className="text-gray-600">Connect your Ethereum wallet to sign and authorize your vote on the blockchain</p>
              </div>
              
              <div className="text-center">
                <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary/10 mb-4 mx-auto">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Voting</h3>
                <p className="text-gray-600">Cast your vote with a simple transaction that's permanently recorded on the blockchain</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => navigate("/welcome")}
                size="lg"
                className="px-6 py-5 text-lg font-medium rounded-lg transition-all bg-primary hover:bg-primary/90"
              >
                Get Started Now
              </Button>
              <p className="mt-4 text-gray-500">Experience the future of voting technology</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Ready to revolutionize voting?</h2>
                <p className="text-gray-600 mb-6">
                  Join thousands of organizations that have already transformed their voting processes with BlockVote's secure blockchain platform.
                </p>
                <Button 
                  onClick={() => navigate("/welcome")}
                  className="bg-primary text-white hover:bg-primary/90 w-full md:w-auto"
                >
                  Choose Your Role
                </Button>
              </div>
              <div className="bg-gradient-to-br from-primary to-primary-600 p-8 md:p-12 flex items-center justify-center text-white">
                <div>
                  <h3 className="text-xl font-bold mb-4">BlockVote Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>Ethereum-based voting contracts</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>Real-time result tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>Easy election management</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>Voter identity verification</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>Complete voting audit trail</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}