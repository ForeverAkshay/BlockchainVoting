import { 
  users, type User, type InsertUser,
  elections, type Election, type InsertElection,
  votes, type Vote, type InsertVote
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(address: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(id: number, walletAddress: string): Promise<User | undefined>;
  
  // Election methods
  getElection(id: number): Promise<Election | undefined>;
  listElections(filterActive?: boolean): Promise<Election[]>;
  listElectionsByCreator(creatorAddress: string): Promise<Election[]>;
  createElection(election: InsertElection): Promise<Election>;
  updateElectionStatus(
    id: number, 
    status: string, 
    contractAddress?: string, 
    transactionHash?: string
  ): Promise<Election | undefined>;
  
  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVotesByElection(electionId: number): Promise<Vote[]>;
  hasVoted(electionId: number, voterAddress: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private elections: Map<number, Election>;
  private votes: Map<number, Vote>;
  private userIdCounter: number;
  private electionIdCounter: number;
  private voteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.elections = new Map();
    this.votes = new Map();
    this.userIdCounter = 1;
    this.electionIdCounter = 1;
    this.voteIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === address,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserWallet(id: number, walletAddress: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, walletAddress };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Election methods
  async getElection(id: number): Promise<Election | undefined> {
    return this.elections.get(id);
  }

  async listElections(filterActive = false): Promise<Election[]> {
    const allElections = Array.from(this.elections.values());
    
    if (!filterActive) {
      return allElections;
    }
    
    const now = new Date();
    return allElections.filter(election => {
      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);
      return startDate <= now && endDate >= now;
    });
  }

  async listElectionsByCreator(creatorAddress: string): Promise<Election[]> {
    return Array.from(this.elections.values()).filter(
      (election) => election.creatorAddress === creatorAddress,
    );
  }

  async createElection(insertElection: InsertElection): Promise<Election> {
    const id = this.electionIdCounter++;
    const now = new Date();
    const election: Election = {
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

  async updateElectionStatus(
    id: number, 
    status: string, 
    contractAddress?: string, 
    transactionHash?: string
  ): Promise<Election | undefined> {
    const election = this.elections.get(id);
    if (!election) return undefined;
    
    const updatedElection: Election = { 
      ...election, 
      status,
      contractAddress: contractAddress || election.contractAddress,
      transactionHash: transactionHash || election.transactionHash
    };
    this.elections.set(id, updatedElection);
    return updatedElection;
  }

  // Vote methods
  async createVote(insertVote: InsertVote): Promise<Vote> {
    const id = this.voteIdCounter++;
    const now = new Date();
    const vote: Vote = {
      ...insertVote,
      id,
      timestamp: now
    };
    this.votes.set(id, vote);
    return vote;
  }

  async getVotesByElection(electionId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.electionId === electionId,
    );
  }

  async hasVoted(electionId: number, voterAddress: string): Promise<boolean> {
    return Array.from(this.votes.values()).some(
      (vote) => vote.electionId === electionId && vote.voterAddress === voterAddress,
    );
  }
}

export const storage = new MemStorage();
