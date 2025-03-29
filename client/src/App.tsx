import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Welcome from "@/pages/welcome";
import Landing from "@/pages/landing";
import VoterPage from "@/pages/voter";
import AdminPage from "@/pages/admin";
import ResultsPage from "@/pages/results";
import { Web3Provider } from "./lib/web3";
import { WebSocketProvider } from "./lib/websocket";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/voter" component={VoterPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/results" component={ResultsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <WebSocketProvider>
          <Router />
          <Toaster />
        </WebSocketProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;
