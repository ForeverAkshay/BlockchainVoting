import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createElectionSchema, insertElectionSchema, insertVoteSchema } from "@shared/schema";
import express from "express";
import { z } from "zod";

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
      // Use createElectionSchema which has proper date transformation
      const validatedData = createElectionSchema.parse(req.body);
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
  
  // Votes routes
  apiRouter.post("/votes", async (req, res) => {
    try {
      const validatedData = insertVoteSchema.parse(req.body);
      
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
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record vote" });
    }
  });
  
  apiRouter.get("/votes/election/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid election ID" });
      }
      
      const votes = await storage.getVotesByElection(id);
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
  return httpServer;
}
