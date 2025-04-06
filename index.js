// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  elections;
  votes;
  userIdCounter;
  electionIdCounter;
  voteIdCounter;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.elections = /* @__PURE__ */ new Map();
    this.votes = /* @__PURE__ */ new Map();
    this.userIdCounter = 1;
    this.electionIdCounter = 1;
    this.voteIdCounter = 1;
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByWalletAddress(address) {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === address
    );
  }
  async createUser(insertUser) {
    const id = this.userIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const user = {
      ...insertUser,
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  async updateUserWallet(id, walletAddress) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, walletAddress };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  // Election methods
  async getElection(id) {
    return this.elections.get(id);
  }
  async listElections(filterActive = false) {
    const allElections = Array.from(this.elections.values());
    if (!filterActive) {
      return allElections;
    }
    const now = /* @__PURE__ */ new Date();
    return allElections.filter((election) => {
      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);
      return startDate <= now && endDate >= now;
    });
  }
  async listElectionsByCreator(creatorAddress) {
    return Array.from(this.elections.values()).filter(
      (election) => election.creatorAddress === creatorAddress
    );
  }
  async createElection(insertElection) {
    const id = this.electionIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const election = {
      ...insertElection,
      id,
      status: "pending",
      contractAddress: null,
      transactionHash: null,
      createdAt: now
    };
    this.elections.set(id, election);
    return election;
  }
  async updateElectionStatus(id, status, contractAddress, transactionHash) {
    const election = this.elections.get(id);
    if (!election) return void 0;
    const updatedElection = {
      ...election,
      status,
      contractAddress: contractAddress || election.contractAddress,
      transactionHash: transactionHash || election.transactionHash
    };
    this.elections.set(id, updatedElection);
    return updatedElection;
  }
  async deleteElection(id) {
    const exists = this.elections.has(id);
    if (!exists) return false;
    const deleted = this.elections.delete(id);
    const votesToDelete = Array.from(this.votes.entries()).filter(([_, vote]) => vote.electionId === id);
    for (const [voteId] of votesToDelete) {
      this.votes.delete(voteId);
    }
    return deleted;
  }
  // Vote methods
  async createVote(insertVote) {
    const id = this.voteIdCounter++;
    const now = /* @__PURE__ */ new Date();
    const vote = {
      ...insertVote,
      id,
      timestamp: now
    };
    this.votes.set(id, vote);
    return vote;
  }
  async getVotesByElection(electionId) {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.electionId === electionId
    );
  }
  async hasVoted(electionId, voterAddress) {
    return Array.from(this.votes.values()).some(
      (vote) => vote.electionId === electionId && vote.voterAddress === voterAddress
    );
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  createdAt: timestamp("created_at").defaultNow()
});
var elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  creatorId: integer("creator_id").references(() => users.id),
  creatorAddress: text("creator_address").notNull(),
  contractAddress: text("contract_address"),
  isPublic: boolean("is_public").default(true),
  options: jsonb("options").notNull().$type(),
  status: text("status").notNull().default("pending"),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow()
});
var votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").references(() => elections.id).notNull(),
  voterAddress: text("voter_address").notNull(),
  optionId: integer("option_id").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  status: true,
  contractAddress: true,
  transactionHash: true,
  createdAt: true
});
var insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true
});
var createElectionSchema = insertElectionSchema.extend({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  startDate: z.union([
    z.date(),
    z.string().transform((date) => new Date(date))
  ]),
  endDate: z.union([
    z.date(),
    z.string().transform((date) => new Date(date))
  ]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  options: z.array(
    z.object({
      id: z.number(),
      name: z.string().min(1).max(100),
      description: z.string().optional()
    })
  ).min(2)
});

// server/routes.ts
import express from "express";
import { z as z2 } from "zod";
import { WebSocketServer, WebSocket } from "ws";
async function registerRoutes(app2) {
  const apiRouter = express.Router();
  apiRouter.get("/elections", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const elections2 = await storage.listElections(activeOnly);
      res.json(elections2);
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
      if (!Array.isArray(req.body.options) || req.body.options.length < 2) {
        return res.status(400).json({ message: "At least two options are required" });
      }
      const dataWithParsedDates = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };
      const validationData = {
        ...dataWithParsedDates,
        creatorAddress: req.body.creatorAddress,
        options: req.body.options
      };
      const validatedData = createElectionSchema.parse(validationData);
      console.log("Elections POST validated data:", validatedData);
      const election = await storage.createElection(validatedData);
      res.status(201).json(election);
    } catch (error) {
      console.error("Election creation error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid election data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create election" });
    }
  });
  apiRouter.delete("/elections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid election ID" });
      }
      const election = await storage.getElection(id);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      const now = /* @__PURE__ */ new Date();
      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);
      if (startDate <= now && endDate >= now) {
        return res.status(400).json({ message: "Cannot delete an active election" });
      }
      if (endDate < now) {
        return res.status(400).json({ message: "Cannot delete a completed election" });
      }
      const deleted = await storage.deleteElection(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete election" });
      }
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
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "election_created",
            electionId: id,
            transactionHash,
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
      const elections2 = await storage.listElectionsByCreator(address);
      res.json(elections2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch elections" });
    }
  });
  apiRouter.get("/votes/election/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid election ID" });
      }
      const votes2 = await storage.getVotesByElection(id);
      console.log(`Votes for election ${id}:`, JSON.stringify(votes2, null, 2));
      res.json(votes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch votes" });
    }
  });
  apiRouter.get("/votes/check", async (req, res) => {
    try {
      const electionId = parseInt(req.query.electionId);
      const voterAddress = req.query.voterAddress;
      if (isNaN(electionId) || !voterAddress) {
        return res.status(400).json({ message: "Election ID and voter address are required" });
      }
      const hasVoted = await storage.hasVoted(electionId, voterAddress);
      res.json({ hasVoted });
    } catch (error) {
      res.status(500).json({ message: "Failed to check voting status" });
    }
  });
  app2.use("/api", apiRouter);
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = /* @__PURE__ */ new Set();
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({
      type: "connect",
      message: "Connected to WebSocket server"
    }));
    ws.on("message", (message) => {
      console.log("Received message:", message.toString());
    });
    ws.on("close", () => {
      clients.delete(ws);
    });
  });
  apiRouter.post("/votes", async (req, res) => {
    try {
      console.log("Received vote data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertVoteSchema.parse(req.body);
      console.log("Validated vote data:", JSON.stringify(validatedData, null, 2));
      const election = await storage.getElection(validatedData.electionId);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      const hasVoted = await storage.hasVoted(validatedData.electionId, validatedData.voterAddress);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted in this election" });
      }
      const vote = await storage.createVote(validatedData);
      console.log("Created vote:", JSON.stringify(vote, null, 2));
      res.status(201).json(vote);
      const updateMessage = JSON.stringify({
        type: "vote",
        electionId: validatedData.electionId,
        candidateId: validatedData.optionId,
        // Use the same 0-based index for consistency
        transactionHash: validatedData.transactionHash,
        message: `Vote cast for candidate "${election.options[validatedData.optionId]?.name || "Unknown"}" in election "${election.title}"`
      });
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(updateMessage);
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record vote" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  base: "/BlockchainVoting",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen(port, () => {
    log(`serving on http://localhost:${port}`);
  });
})();
