import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address").unique(),
  createdAt: timestamp("created_at").defaultNow()
});

// Election model
export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  creatorId: integer("creator_id").references(() => users.id),
  creatorAddress: text("creator_address").notNull(),
  contractAddress: text("contract_address"),
  isPublic: boolean("is_public").default(true),
  options: jsonb("options").notNull().$type<{ id: number; name: string; description?: string }[]>(),
  status: text("status").notNull().default("pending"),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow()
});

// Vote model for caching/tracking votes
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").references(() => elections.id).notNull(),
  voterAddress: text("voter_address").notNull(),
  optionId: integer("option_id").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  status: true,
  contractAddress: true,
  transactionHash: true,
  createdAt: true
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Election = typeof elections.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// Extend schemas with additional validation if needed
export const createElectionSchema = insertElectionSchema.extend({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  options: z.array(
    z.object({
      id: z.number(),
      name: z.string().min(1).max(100),
      description: z.string().optional()
    })
  ).min(2)
});
