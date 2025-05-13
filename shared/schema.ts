import { pgTable, text, serial, integer, boolean, decimal, timestamp, date, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table - matches the actual database structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number"),
  active: boolean("active").default(true).notNull(),
  notes: text("notes"),
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
  active: boolean("active").default(true).notNull(),
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

// Base relations
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
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  phoneNumber: (schema) => schema.optional()
});

export const userBalanceInsertSchema = createInsertSchema(userBalance);
export const transactionsInsertSchema = createInsertSchema(transactions);
export const userPromotionsInsertSchema = createInsertSchema(userPromotions, {
  status: (schema) => z.enum(["active", "completed", "cancelled"])
});

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

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  active: boolean("active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Promotions table for deposit bonuses
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  bonusType: text("bonus_type").notNull(), // bonus, cashback, freespin
  bonusValue: decimal("bonus_value", { precision: 10, scale: 2 }).notNull(),
  minDeposit: decimal("min_deposit", { precision: 10, scale: 2 }).notNull(),
  maxBonus: decimal("max_bonus", { precision: 10, scale: 2 }),
  turnoverRequirement: decimal("turnover_requirement", { precision: 5, scale: 2 }).notNull(), // Multiplier for wagering requirement
  maxUsagePerDay: integer("max_usage_per_day").default(1), // Maximum number of times a user can use this promotion per day
  daysOfWeek: json("days_of_week").default([0,1,2,3,4,5,6]), // Array of days when promotion is available (0=Sunday, 1=Monday, etc)
  timezone: text("timezone").default("Australia/Sydney").notNull(), // Timezone for availability checks
  active: boolean("active").default(true).notNull(),
  imageUrl: text("image_url"),
  createdBy: integer("created_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Player activity logs
export const playerActivity = pgTable("player_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: text("activity_type").notNull(), // login, game_play, deposit, withdrawal
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Deposits table
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull(), // credit_card, bank_transfer, crypto
  status: text("status").notNull().default("pending"), // pending, completed, failed
  transactionId: text("transaction_id"),
  promotionId: integer("promotion_id").references(() => promotions.id),
  bonusAmount: decimal("bonus_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull(), // bank_transfer, crypto
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  rejectionReason: text("rejection_reason"),
  bankDetails: json("bank_details"),
  cryptoAddress: text("crypto_address"),
  approvedBy: integer("approved_by").references(() => adminUsers.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Admin action logs
export const adminActionLogs = pgTable("admin_action_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsers.id).notNull(),
  actionType: text("action_type").notNull(), // user_update, balance_adjustment, promotion_create, etc.
  details: json("details").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// User promotions table for tracking active promotions
export const userPromotions = pgTable("user_promotions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  promotionId: integer("promotion_id").references(() => promotions.id).notNull(),
  depositId: integer("deposit_id").references(() => deposits.id).notNull(),
  bonusAmount: decimal("bonus_amount", { precision: 12, scale: 2 }).notNull(),
  turnoverRequirement: decimal("turnover_requirement", { precision: 12, scale: 2 }).notNull(), // Total amount to wager
  wageringProgress: decimal("wagering_progress", { precision: 12, scale: 2 }).default("0").notNull(), // Amount wagered so far
  status: text("status").notNull().default("active"), // active, completed, cancelled
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Affiliate table (placeholder for future development)
export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  commission: decimal("commission", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// New schemas for validation
export const adminUsersInsertSchema = createInsertSchema(adminUsers, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  email: (schema) => schema.email("Email must be valid"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
  role: (schema) => z.enum(["admin", "super_admin"])
});

export const promotionsInsertSchema = createInsertSchema(promotions, {
  name: (schema) => schema.min(3, "Name must be at least 3 characters"),
  bonusType: (schema) => z.enum(["bonus", "cashback", "freespin"]),
  bonusValue: (schema) => schema.refine(val => parseFloat(val) > 0, "Bonus value must be positive"),
  minDeposit: (schema) => schema.refine(val => parseFloat(val) > 0, "Minimum deposit must be positive"),
  turnoverRequirement: (schema) => schema.refine(val => parseFloat(val) > 0, "Turnover requirement must be positive"),
  maxUsagePerDay: (schema) => schema.refine(val => val > 0, "Usage limit must be positive"),
  daysOfWeek: (schema) => schema.refine(
    val => {
      if (!Array.isArray(val)) return false;
      if (val.length === 0) return false;
      return val.every(day => typeof day === 'number' && day >= 0 && day <= 6);
    },
    "Days of week must be valid (0-6)"
  ),
  timezone: (schema) => schema.refine(
    val => val.includes("/"), 
    "Timezone must be in Continent/City format"
  ),
  imageUrl: (schema) => schema.nullable().optional().refine(
    val => !val || val.startsWith('http'), 
    "Image URL must be a valid URL starting with http"
  )
});

export const depositsInsertSchema = createInsertSchema(deposits);
export const withdrawalsInsertSchema = createInsertSchema(withdrawals);
export const playerActivityInsertSchema = createInsertSchema(playerActivity);
export const adminActionLogsInsertSchema = createInsertSchema(adminActionLogs);
export const affiliatesInsertSchema = createInsertSchema(affiliates);

// Types for TypeScript
export type AdminUserInsert = z.infer<typeof adminUsersInsertSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export type PromotionInsert = z.infer<typeof promotionsInsertSchema>;
export type Promotion = typeof promotions.$inferSelect;

export type DepositInsert = z.infer<typeof depositsInsertSchema>;
export type Deposit = typeof deposits.$inferSelect;

export type WithdrawalInsert = z.infer<typeof withdrawalsInsertSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;

export type PlayerActivityInsert = z.infer<typeof playerActivityInsertSchema>;
export type PlayerActivity = typeof playerActivity.$inferSelect;

export type AdminActionLogInsert = z.infer<typeof adminActionLogsInsertSchema>;
export type AdminActionLog = typeof adminActionLogs.$inferSelect;

export type AffiliateInsert = z.infer<typeof affiliatesInsertSchema>;
export type Affiliate = typeof affiliates.$inferSelect;

export type UserPromotionInsert = z.infer<typeof userPromotionsInsertSchema>;
export type UserPromotion = typeof userPromotions.$inferSelect;

// Admin-specific relations - defined after all tables have been created
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  promotions: many(promotions),
  adminActionLogs: many(adminActionLogs),
  approvedWithdrawals: many(withdrawals, { relationName: "approver" })
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  createdByAdmin: one(adminUsers, { fields: [promotions.createdBy], references: [adminUsers.id] }),
  deposits: many(deposits)
}));

export const depositsRelations = relations(deposits, ({ one }) => ({
  user: one(users, { fields: [deposits.userId], references: [users.id] }),
  promotion: one(promotions, { fields: [deposits.promotionId], references: [promotions.id] })
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, { fields: [withdrawals.userId], references: [users.id] }),
  approvedByAdmin: one(adminUsers, { fields: [withdrawals.approvedBy], references: [adminUsers.id], relationName: "approver" })
}));

export const playerActivityRelations = relations(playerActivity, ({ one }) => ({
  user: one(users, { fields: [playerActivity.userId], references: [users.id] })
}));

export const adminActionLogsRelations = relations(adminActionLogs, ({ one }) => ({
  admin: one(adminUsers, { fields: [adminActionLogs.adminId], references: [adminUsers.id] })
}));
