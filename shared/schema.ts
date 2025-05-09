import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table - matches the actual database structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  // Note: role, status, lastLogin are only in our API response but not the actual database
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  provider: text("provider").notNull(),
  image: text("image").notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  isFeatured: boolean("is_featured").default(false),
  isPopular: boolean("is_popular").default(false),
  isNew: boolean("is_new").default(false),
  isJackpot: boolean("is_jackpot").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  category: text("category"), // String representation for filtering (e.g., "slots", "table", "live")
  jackpotAmount: decimal("jackpot_amount", { precision: 12, scale: 2 }),
  rtp: decimal("rtp", { precision: 5, scale: 2 }),
  volatility: text("volatility"),
  minBet: decimal("min_bet", { precision: 10, scale: 2 }).default("0.5"),
  maxBet: decimal("max_bet", { precision: 10, scale: 2 }).default("100"),
  playCount: integer("play_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// User balance table
export const userBalance = pgTable("user_balance", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("1000"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Transaction history table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // bet, win, deposit
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  gameId: integer("game_id").references(() => games.id),
  balanceBefore: decimal("balance_before", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  games: many(games)
}));

export const gamesRelations = relations(games, ({ one }) => ({
  category: one(categories, { fields: [games.categoryId], references: [categories.id] })
}));

// Schemas for validation
export const categoriesInsertSchema = createInsertSchema(categories, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  slug: (schema) => schema.min(2, "Slug must be at least 2 characters")
});

export const gamesInsertSchema = createInsertSchema(games, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  slug: (schema) => schema.min(2, "Slug must be at least 2 characters"),
  provider: (schema) => schema.min(2, "Provider must be at least 2 characters"),
  image: (schema) => schema.url("Image must be a valid URL")
});

export const usersInsertSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  email: (schema) => schema.email("Email must be valid"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters")
});

export const userBalanceInsertSchema = createInsertSchema(userBalance);
export const transactionsInsertSchema = createInsertSchema(transactions);

// Types for TypeScript
export type UserInsert = z.infer<typeof usersInsertSchema>;
export type User = typeof users.$inferSelect;

export type CategoryInsert = z.infer<typeof categoriesInsertSchema>;
export type Category = typeof categories.$inferSelect;

export type GameInsert = z.infer<typeof gamesInsertSchema>;
export type Game = typeof games.$inferSelect;

export type UserBalanceInsert = z.infer<typeof userBalanceInsertSchema>;
export type UserBalance = typeof userBalance.$inferSelect;

export type TransactionInsert = z.infer<typeof transactionsInsertSchema>;
export type Transaction = typeof transactions.$inferSelect;
