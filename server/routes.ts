import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createElectionSchema, insertElectionSchema, insertVoteSchema } from "@shared/schema";
import express from "express";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  
  // Elections routes
  apiRouter.get("/elections", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const elections = await storage.listElections(activeOnly);
      res.json(elections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch elections" });
    }
  });
  
  apiRouter.get("/elections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid election ID" });
      }
      
      const election = await storage.getElection(id);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      res.json(election);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch election" });
    }
  });
  
  apiRouter.post("/elections", async (req, res) => {
    try {
      console.log("Elections POST request body:", req.body);
      
      // Check for secondary form submission with date/time fields (ignore these)
      if (req.body.date && req.body.startTime && req.body.endTime && !req.body.options) {
        console.log("Missing required fields:", {
          title: !!req.body.title,
          description: !!req.body.description,
          startDate: !!req.body.startDate,
          endDate: !!req.body.endDate,
          options: !!req.body.options,
          creatorAddress: !!req.body.creatorAddress
        });
        return res.status(400).json({ message: "Missing required fields for election creation" });
      }
      
      // Check if required fields are present
      if (!req.body.title || !req.body.description || !req.body.startDate || !req.body.endDate || !req.body.options || !req.body.creatorAddress) {
        console.log("Missing required fields:", {
          title: !!req.body.title,
          description: !!req.body.description,
          startDate: !!req.body.startDate,
          endDate: !!req.body.endDate,
          options: !!req.body.options,
          creatorAddress: !!req.body.creatorAddress
        });
        return res.status(400).json({ message: "Missing required fields for election creation" });
      }
      
      // Make sure options is properly formatted
      if (!Array.isArray(req.body.options) || req.body.options.length < 2) {
        return res.status(400).json({ message: "At least two options are required" });
      }
      
      // Convert date strings to Date objects before validation
      const dataWithParsedDates = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };
      
      // Explicitly include creatorAddress and options which are required
      const validationData = {
        ...dataWithParsedDates,
        creatorAddress: req.body.creatorAddress,
        options: req.body.options
      };
      
      // Use createElectionSchema which has proper date transformation
      const validatedData = createElectionSchema.parse(validationData);
      console.log("Elections POST validated data:", validatedData);
      
      // Create the election with the validated data
      const election = await storage.createElection(validatedData);
      res.status(201).json(election);
    } catch (error) {
      console.error("Election creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid election data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create election" });
    }
  });
  
  // Add DELETE endpoint for elections
  apiRouter.delete("/elections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid election ID" });
      }
      
      // Check if the election exists
      const election = await storage.getElection(id);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      // Check if the election is active or completed
      const now = new Date();
      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);
      
      if (startDate <= now && endDate >= now) {
        return res.status(400).json({ message: "Cannot delete an active election" });
      }
      
      if (endDate < now) {
        return res.status(400).json({ message: "Cannot delete a completed election" });
      }
      
      // Delete the election
      const deleted = await storage.deleteElection(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete election" });
      }
      
      // Return success
      res.status(200).json({ success: true, message: "Election deleted successfully" });
    } catch (error) {
      console.error("Error deleting election:", error);
      res.status(500).json({ message: "Failed to delete election" });
    }
  });

  apiRouter.put("/elections/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid election ID" });
      }
      
      const { status, contractAddress, transactionHash } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedElection = await storage.updateElectionStatus(
        id, 
        status, 
        contractAddress, 
        transactionHash
      );
      
      if (!updatedElection) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      // Broadcast election status update to all connected clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'election_created',
            electionId: id,
            transactionHash: transactionHash,
            message: `Election "${updatedElection.title}" has been deployed to the blockchain`
          }));
        }
      });
      
      res.json(updatedElection);
    } catch (error) {
      res.status(500).json({ message: "Failed to update election status" });
    }
  });
  
  apiRouter.get("/elections/creator/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address) {
        return res.status(400).json({ message: "Creator address is required" });
      }
      
      const elections = await storage.listElectionsByCreator(address);
      res.json(elections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch elections" });
    }
  });
  
  // Votes routes - This is now handled below with WebSocket integration
  
  apiRouter.get("/votes/election/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid election ID" });
      }
      
      const votes = await storage.getVotesByElection(id);
      
      // Log votes for debugging
      console.log(`Votes for election ${id}:`, JSON.stringify(votes, null, 2));
      
      res.json(votes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });
  
  apiRouter.get("/votes/check", async (req, res) => {
    try {
      const electionId = parseInt(req.query.electionId as string);
      const voterAddress = req.query.voterAddress as string;
      
      if (isNaN(electionId) || !voterAddress) {
        return res.status(400).json({ message: "Election ID and voter address are required" });
      }
      
      const hasVoted = await storage.hasVoted(electionId, voterAddress);
      res.json({ hasVoted });
    } catch (error) {
      res.status(500).json({ message: "Failed to check voting status" });
    }
  });

  // Use the API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  
  // Add WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    // Add client to set
    clients.add(ws);
    
    // Send initial message
    ws.send(JSON.stringify({
      type: 'connect',
      message: 'Connected to WebSocket server'
    }));
    
    // Handle client messages
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    
    // Remove client when disconnected
    ws.on('close', () => {
      clients.delete(ws);
    });
  });
  
  // Modify the vote POST handler to broadcast updates when a vote is cast
  apiRouter.post("/votes", async (req, res) => {
    try {
      console.log("Received vote data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertVoteSchema.parse(req.body);
      console.log("Validated vote data:", JSON.stringify(validatedData, null, 2));
      
      // Check if the election exists
      const election = await storage.getElection(validatedData.electionId);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      
      // Check if the user has already voted
      const hasVoted = await storage.hasVoted(validatedData.electionId, validatedData.voterAddress);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted in this election" });
      }
      
      const vote = await storage.createVote(validatedData);
      console.log("Created vote:", JSON.stringify(vote, null, 2));
      res.status(201).json(vote);
      
      // Broadcast vote update to all connected clients
      const updateMessage = JSON.stringify({
        type: 'vote',
        electionId: validatedData.electionId,
        candidateId: validatedData.optionId, // Use the same 0-based index for consistency
        transactionHash: validatedData.transactionHash,
        message: `Vote cast for candidate "${election.options[validatedData.optionId]?.name || 'Unknown'}" in election "${election.title}"`
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(updateMessage);
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record vote" });
    }
  });
  
  return httpServer;
}
