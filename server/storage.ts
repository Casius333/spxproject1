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
import { eq, desc, and, like, or, sql } from "drizzle-orm";

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
  try {
    // Use the safer query API instead of select
    return await db.query.games.findMany({
      orderBy: desc(games.createdAt),
    });
  } catch (error) {
    console.error('Error in getAllGames:', error);
    // Return empty array on error instead of crashing
    return [];
  }
}

export async function getGamesByCategory(categoryId: number): Promise<Game[]> {
  try {
    // Use the safer query API instead of select
    return await db.query.games.findMany({
      where: eq(games.categoryId, categoryId),
      orderBy: desc(games.createdAt),
    });
  } catch (error) {
    console.error('Error in getGamesByCategory:', error);
    return [];
  }
}

export async function getGameById(id: number): Promise<Game | undefined> {
  try {
    return await db.query.games.findFirst({
      where: eq(games.id, id),
      with: {
        category: true,
      },
    });
  } catch (error) {
    console.error('Error in getGameById:', error);
    return undefined;
  }
}

export async function getFeaturedGames(): Promise<Game[]> {
  try {
    return await db.query.games.findMany({
      where: eq(games.isFeatured, true),
      orderBy: desc(games.createdAt),
      with: {
        category: true,
      },
    });
  } catch (error) {
    console.error('Error in getFeaturedGames:', error);
    return [];
  }
}

export async function getJackpotGames(): Promise<Game[]> {
  try {
    return await db.query.games.findMany({
      where: eq(games.isJackpot, true),
      orderBy: desc(games.jackpotAmount),
      with: {
        category: true,
      },
    });
  } catch (error) {
    console.error('Error in getJackpotGames:', error);
    return [];
  }
}

export async function getPopularGames(): Promise<Game[]> {
  try {
    return await db.query.games.findMany({
      where: eq(games.isPopular, true),
      orderBy: desc(games.createdAt),
      with: {
        category: true,
      },
    });
  } catch (error) {
    console.error('Error in getPopularGames:', error);
    return [];
  }
}

export async function getNewGames(): Promise<Game[]> {
  try {
    return await db.query.games.findMany({
      where: eq(games.isNew, true),
      orderBy: desc(games.createdAt),
      with: {
        category: true,
      },
    });
  } catch (error) {
    console.error('Error in getNewGames:', error);
    return [];
  }
}

export async function searchGames(query: string): Promise<Game[]> {
  try {
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
  } catch (error) {
    console.error('Error in searchGames:', error);
    return [];
  }
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
      userId: userId,
      balance: "1000", // Default starting balance as string for decimal type
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
      balance: balanceAfter.toString(), // Convert to string for decimal type
      updatedAt: new Date() 
    })
    .where(eq(userBalance.userId, userId))
    .returning();
  
  // Record transaction
  await db.insert(transactions).values({
    userId: userId,
    type: type,
    amount: amount.toString(), // Convert to string for decimal type
    balanceBefore: balanceBefore.toString(),
    balanceAfter: balanceAfter.toString(),
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
