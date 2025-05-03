import { db } from "@db";
import {
  categories,
  games,
  userBalance,
  transactions,
  type Game,
  type Category,
  type UserBalance,
  type Transaction
} from "@shared/schema";
import { eq, desc, and, like, or } from "drizzle-orm";

// Generate a temporary user ID for session
const getGuestUserId = (): string => {
  const userId = process.env.GUEST_USER_ID || 'guest-user';
  return userId;
};

// Categories
export async function getAllCategories(): Promise<Category[]> {
  return await db.query.categories.findMany({
    orderBy: categories.name,
  });
}

// Games
export async function getAllGames(): Promise<Game[]> {
  return await db.query.games.findMany({
    orderBy: desc(games.createdAt),
    with: {
      category: true,
    },
  });
}

export async function getGamesByCategory(categoryId: number): Promise<Game[]> {
  return await db.query.games.findMany({
    where: eq(games.categoryId, categoryId),
    orderBy: desc(games.createdAt),
    with: {
      category: true,
    },
  });
}

export async function getGameById(id: number): Promise<Game | undefined> {
  return await db.query.games.findFirst({
    where: eq(games.id, id),
    with: {
      category: true,
    },
  });
}

export async function getFeaturedGames(): Promise<Game[]> {
  return await db.query.games.findMany({
    where: eq(games.isFeatured, true),
    orderBy: desc(games.createdAt),
    with: {
      category: true,
    },
  });
}

export async function getJackpotGames(): Promise<Game[]> {
  return await db.query.games.findMany({
    where: eq(games.isJackpot, true),
    orderBy: desc(games.jackpotAmount),
    with: {
      category: true,
    },
  });
}

export async function getPopularGames(): Promise<Game[]> {
  return await db.query.games.findMany({
    where: eq(games.isPopular, true),
    orderBy: desc(games.createdAt),
    with: {
      category: true,
    },
  });
}

export async function getNewGames(): Promise<Game[]> {
  return await db.query.games.findMany({
    where: eq(games.isNew, true),
    orderBy: desc(games.createdAt),
    with: {
      category: true,
    },
  });
}

export async function searchGames(query: string): Promise<Game[]> {
  return await db.query.games.findMany({
    where: or(
      like(games.title, `%${query}%`),
      like(games.provider, `%${query}%`),
      like(games.description, `%${query}%`)
    ),
    orderBy: desc(games.createdAt),
    with: {
      category: true,
    },
  });
}

// User balance
export async function getUserBalance(): Promise<UserBalance | undefined> {
  const userId = getGuestUserId();
  return await db.query.userBalance.findFirst({
    where: eq(userBalance.userId, userId),
  });
}

export async function updateUserBalance(amount: number, type: 'bet' | 'win' | 'deposit'): Promise<UserBalance> {
  const userId = getGuestUserId();
  
  // Get current balance or initialize if not exists
  let currentBalance = await getUserBalance();
  
  if (!currentBalance) {
    const [newBalance] = await db.insert(userBalance).values({
      userId,
      balance: 1000, // Default starting balance
    }).returning();
    
    currentBalance = newBalance;
  }
  
  // Calculate new balance
  const balanceBefore = parseFloat(currentBalance.balance.toString());
  let balanceAfter = balanceBefore;
  
  if (type === 'bet') {
    balanceAfter = Math.max(0, balanceBefore - amount);
  } else if (type === 'win' || type === 'deposit') {
    balanceAfter = balanceBefore + amount;
  }
  
  // Update balance
  const [updatedBalance] = await db.update(userBalance)
    .set({ 
      balance: balanceAfter,
      updatedAt: new Date() 
    })
    .where(eq(userBalance.userId, userId))
    .returning();
  
  // Record transaction
  await db.insert(transactions).values({
    userId,
    type,
    amount,
    balanceBefore,
    balanceAfter,
    createdAt: new Date()
  });
  
  return updatedBalance;
}

// Transactions
export async function getTransactionHistory(limit: number = 20): Promise<Transaction[]> {
  const userId = getGuestUserId();
  
  return await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    orderBy: desc(transactions.createdAt),
    limit,
  });
}
