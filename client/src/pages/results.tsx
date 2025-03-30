import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Election } from "@shared/schema";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface CandidateResult {
  id: number;
  name: string;
  description?: string;
  voteCount: number;
  percentage: number;
  isWinner?: boolean;
}

export default function ResultsPage() {
  const [location] = useLocation();
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Extract electionId from URL query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const electionId = searchParams.get("id");
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  useEffect(() => {
    if (!electionId) {
      setError("No election ID provided");
      setIsLoading(false);
      return;
    }
    
    const fetchElectionAndResults = async () => {
      try {
        // Fetch election details
        const electionResponse = await fetch(`/api/elections/${electionId}`);
        if (!electionResponse.ok) {
          throw new Error("Failed to fetch election details");
        }
        const electionData = await electionResponse.json();
        setElection(electionData);
        
        // Fetch votes
        const votesResponse = await fetch(`/api/votes/election/${electionId}`);
        if (!votesResponse.ok) {
          throw new Error("Failed to fetch votes");
        }
        const votes = await votesResponse.json();
        
        // Count votes for each option
        const voteCounts = new Map<number, number>();
        
        // Initialize all options with 0 votes
        electionData.options.forEach((option: any, index: number) => {
          // Use index to match the 0-based indexing used in VotingInterface
          voteCounts.set(index, 0);
        });
        
        console.log("Vote data from API:", JSON.stringify(votes, null, 2));
        
        // Count actual votes
        votes.forEach((vote: any) => {
          // Use the optionId directly from the vote record
          // We're now consistently using 0-based indexing across the application
          const optionId = vote.optionId;
          
          console.log(`Processing vote with optionId: ${optionId}`);
          
          // Ensure the optionId is valid
          if (optionId !== undefined && optionId >= 0 && optionId < electionData.options.length) {
            const currentCount = voteCounts.get(optionId) || 0;
            voteCounts.set(optionId, currentCount + 1);
          } else {
            console.error(`Invalid optionId ${optionId} in vote:`, vote);
          }
        });
        
        // Create results with actual vote counts
        const realResults = electionData.options.map((option: any, index: number) => ({
          id: option.id || index,
          name: option.name,
          description: option.description,
          voteCount: voteCounts.get(index) || 0, // Use index (0-based) to match vote records
          percentage: 0 // Will be calculated below
        }));
        
        // Calculate percentages
        const totalVotes = realResults.reduce((sum: number, candidate: CandidateResult) => sum + candidate.voteCount, 0);
        const resultsWithPercentages = realResults.map((result: CandidateResult) => ({
          ...result,
          percentage: totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0
        }));
        
        // Sort by vote count (descending)
        const sortedResults = resultsWithPercentages.sort((a: CandidateResult, b: CandidateResult) => b.voteCount - a.voteCount);
        
        // Add visual enhancements for the winner if there are votes
        const enhancedResults = sortedResults.map((result: CandidateResult) => {
          const isWinner = totalVotes > 0 && result.voteCount > 0 && 
                          result.voteCount === Math.max(...resultsWithPercentages.map((r: CandidateResult) => r.voteCount));
          return {
            ...result,
            isWinner
          };
        });
        
        setResults(enhancedResults);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching election data:", error);
        setError("Failed to load election results");
        setIsLoading(false);
      }
    };
    
    fetchElectionAndResults();
  }, [electionId]);
  
  // Prepare chart data
  const chartData = results.map(result => ({
    name: result.name,
    votes: result.voteCount,
    percentage: result.percentage
  }));
  
  // Find the winner (if any)
  const winner = results.find(result => result.isWinner);
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Loading results...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !election) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "Could not find election"}</p>
              <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Button 
            className="mb-6 hover:bg-gray-200" 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            ← Back
          </Button>
          
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Election Results</CardTitle>
              <p className="text-xl text-gray-600 mt-2">{election.title}</p>
              <p className="text-sm text-gray-500 mt-1">{election.description}</p>
            </CardHeader>
            <CardContent>
              {winner && (
                <div className="text-center mb-8 p-6 bg-green-50 rounded-lg">
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Congratulations!</h2>
                  <h3 className="text-4xl font-bold mb-3 text-primary">{winner.name}</h3>
                  <p className="text-green-700">
                    Won with {winner.voteCount} vote{winner.voteCount !== 1 ? 's' : ''} ({winner.percentage.toFixed(1)}%)
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-center">Vote Distribution</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="votes"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} votes`, 'Votes']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-center">Vote Counts</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} votes`, 'Votes']} />
                        <Legend />
                        <Bar dataKey="votes" fill="#8884d8" name="Votes">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Detailed Results</h3>
                <div className="overflow-hidden rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Votes
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result, index) => (
                        <tr key={result.id} className={result.isWinner ? "bg-green-50" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {result.name}
                                  {result.isWinner && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Winner
                                    </span>
                                  )}
                                </div>
                                {result.description && (
                                  <div className="text-xs text-gray-500">
                                    {result.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.voteCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Total Votes: <span className="font-medium">{results.reduce((sum, result) => sum + result.voteCount, 0)}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}