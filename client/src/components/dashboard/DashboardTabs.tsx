import { useState } from "react";
import ElectionList from "../elections/ElectionList";
import CreateElectionForm from "../elections/CreateElectionForm";
import MyElections from "../elections/MyElections";

type TabType = "vote" | "myElections" | "createElection";

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("vote");

  return (
    <div className="flex-grow container mx-auto px-4 py-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex">
          <button 
            onClick={() => setActiveTab("vote")}
            className={`py-3 px-6 ${
              activeTab === "vote" 
                ? "border-b-2 border-primary text-primary font-medium" 
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Vote
          </button>
          <button 
            onClick={() => setActiveTab("myElections")}
            className={`py-3 px-6 ${
              activeTab === "myElections" 
                ? "border-b-2 border-primary text-primary font-medium" 
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            My Elections
          </button>
          <button 
            onClick={() => setActiveTab("createElection")}
            className={`py-3 px-6 ${
              activeTab === "createElection" 
                ? "border-b-2 border-primary text-primary font-medium" 
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Create Election
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "vote" && <ElectionList />}
        {activeTab === "myElections" && <MyElections />}
        {activeTab === "createElection" && <CreateElectionForm onSuccess={() => setActiveTab("myElections")} />}
      </div>
    </div>
  );
}
