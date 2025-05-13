import {
  type Game,
  type Category,
  type UserBalance,
  type Transaction
} from "@shared/schema";

// Generate a temporary user ID for session
const getGuestUserId = (): string => {
  const userId = process.env.GUEST_USER_ID || 'guest-user';
  return userId;
};

// Mock data for categories
const mockCategories = [
  { id: 1, name: 'All Slots', slug: 'all-slots', createdAt: new Date() },
  { id: 2, name: 'Classic Slots', slug: 'classic-slots', createdAt: new Date() },
  { id: 3, name: 'Video Slots', slug: 'video-slots', createdAt: new Date() },
  { id: 4, name: 'Jackpot Slots', slug: 'jackpot-slots', createdAt: new Date() },
  { id: 5, name: 'Megaways Slots', slug: 'megaways-slots', createdAt: new Date() }
];

// Mock data for games
const mockGames = [
  {
    id: 1,
    title: 'Big Bass Bonanza',
    slug: 'big-bass-bonanza',
    description: 'Catch the big one in this fishing-themed slot with free spins and money symbols.',
    provider: 'Pragmatic Play',
    image: 'https://cdn.plaingaming.net/files/online-slots/big-bass-bonanza-thumbnail.webp',
    categoryId: 3,
    isFeatured: true,
    isPopular: true,
    isNew: false,
    isJackpot: false,
    isActive: true,
    category: 'video-slots',
    rtp: 96.71,
    volatility: 'High',
    minBet: 0.10,
    maxBet: 250.00,
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    title: 'Starburst',
    slug: 'starburst',
    description: 'A classic cosmic slot with expanding wilds and respins.',
    provider: 'NetEnt',
    image: 'https://cdn.plaingaming.net/files/online-slots/starburst-thumbnail.webp',
    categoryId: 2,
    isFeatured: true,
    isPopular: true,
    isNew: false,
    isJackpot: false,
    isActive: true,
    category: 'classic-slots',
    rtp: 96.09,
    volatility: 'Low',
    minBet: 0.10,
    maxBet: 100.00,
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    title: 'Mega Moolah',
    slug: 'mega-moolah',
    description: 'The millionaire maker with four progressive jackpots.',
    provider: 'Microgaming',
    image: 'https://cdn.plaingaming.net/files/online-slots/mega-moolah-thumbnail.webp',
    categoryId: 4,
    isFeatured: true,
    isPopular: true,
    isNew: false,
    isJackpot: true,
    isActive: true,
    category: 'jackpot-slots',
    jackpotAmount: 1000000,
    rtp: 88.12,
    volatility: 'Medium',
    minBet: 0.25,
    maxBet: 6.25,
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    title: 'Gonzo\'s Quest Megaways',
    slug: 'gonzos-quest-megaways',
    description: 'Join Gonzo in his quest for El Dorado with up to 117,649 ways to win.',
    provider: 'Red Tiger',
    image: 'https://cdn.plaingaming.net/files/online-slots/gonzos-quest-megaways-thumbnail.webp',
    categoryId: 5,
    isFeatured: true,
    isPopular: true,
    isNew: true,
    isJackpot: false,
    isActive: true,
    category: 'megaways-slots',
    rtp: 96.00,
    volatility: 'High',
    minBet: 0.10,
    maxBet: 4.00,
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    title: 'Sweet Bonanza',
    slug: 'sweet-bonanza',
    description: 'A sweet treat with tumbling reels and multipliers.',
    provider: 'Pragmatic Play',
    image: 'https://cdn.plaingaming.net/files/online-slots/sweet-bonanza-thumbnail.webp',
    categoryId: 3,
    isFeatured: true,
    isPopular: true,
    isNew: false,
    isJackpot: false,
    isActive: true,
    category: 'video-slots',
    rtp: 96.51,
    volatility: 'High',
    minBet: 0.20,
    maxBet: 125.00,
    playCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Categories
export async function getAllCategories(): Promise<Category[]> {
  return mockCategories as Category[];
}

// Games
export async function getAllGames(): Promise<Game[]> {
  return mockGames as unknown as Game[];
}

export async function getGamesByCategory(categoryId: number): Promise<Game[]> {
  return mockGames.filter(game => game.categoryId === categoryId) as unknown as Game[];
}

export async function getGameById(id: number): Promise<Game | undefined> {
  return mockGames.find(game => game.id === id) as unknown as Game | undefined;
}

export async function getFeaturedGames(): Promise<Game[]> {
  return mockGames.filter(game => game.isFeatured) as unknown as Game[];
}

export async function getJackpotGames(): Promise<Game[]> {
  return mockGames.filter(game => game.isJackpot) as unknown as Game[];
}

export async function getPopularGames(): Promise<Game[]> {
  return mockGames.filter(game => game.isPopular) as unknown as Game[];
}

export async function getNewGames(): Promise<Game[]> {
  return mockGames.filter(game => game.isNew) as unknown as Game[];
}

export async function searchGames(query: string): Promise<Game[]> {
  const lowercaseQuery = query.toLowerCase();
  return mockGames.filter(game => 
    game.title.toLowerCase().includes(lowercaseQuery) ||
    game.provider.toLowerCase().includes(lowercaseQuery) ||
    (game.description && game.description.toLowerCase().includes(lowercaseQuery))
  ) as unknown as Game[];
}

// Mock balance data
const mockBalance = {
  id: 1,
  userId: getGuestUserId(),
  balance: 1000,
  updatedAt: new Date()
};

// Mock transactions
const mockTransactions: any[] = [];

// User balance
export async function getUserBalance(): Promise<UserBalance | undefined> {
  // Import required modules
  const { db } = await import('../db');
  const { userBalance, users } = await import('../shared/schema');
  const { eq } = await import('drizzle-orm');
  
  try {
    // Try to get current user from auth system (for now using fixed ID)
    const userId = 12; // This should be the ID of the logged-in user
    
    // Find existing balance record
    const balanceRecord = await db.select().from(userBalance)
      .where(eq(userBalance.userId, userId.toString()))
      .limit(1);
    
    // If no balance record exists, create one with default balance
    if (balanceRecord.length === 0) {
      const defaultBalance = 1000; // Default starting balance
      
      // Create new balance record
      const [newBalanceRecord] = await db.insert(userBalance)
        .values({
          userId: userId.toString(),
          balance: defaultBalance.toString(),
          updatedAt: new Date(),
        })
        .returning();
      
      return newBalanceRecord;
    }
    
    return balanceRecord[0];
  } catch (error) {
    console.error('Error getting user balance:', error);
    // Fallback to mock data in case of error
    return mockBalance as unknown as UserBalance;
  }
}

export async function updateUserBalance(userId: number = 12, amount: number, type: 'bet' | 'win' | 'deposit' | 'bonus'): Promise<UserBalance> {
  // Import required modules
  const { db } = await import('../db');
  const { userBalance, transactions } = await import('../shared/schema');
  const { eq } = await import('drizzle-orm');
  
  try {
    // Use provided userId or default to 12
    
    // Get current balance (will create if doesn't exist)
    const currentBalance = await getUserBalance();
    
    if (!currentBalance) {
      throw new Error('Failed to retrieve user balance');
    }
    
    // Calculate new balance
    const balanceBefore = parseFloat(currentBalance.balance.toString());
    let newBalanceAmount: number;
    
    if (type === 'bet') {
      newBalanceAmount = Math.max(0, balanceBefore - amount);
    } else if (type === 'win' || type === 'deposit' || type === 'bonus') {
      newBalanceAmount = balanceBefore + amount;
    } else {
      newBalanceAmount = balanceBefore;
    }
    
    // Update balance record
    const [updatedBalance] = await db.update(userBalance)
      .set({
        balance: newBalanceAmount.toString(),
        updatedAt: new Date()
      })
      .where(eq(userBalance.userId, userId.toString()))
      .returning();
    
    // Create transaction record
    await db.insert(transactions)
      .values({
        userId: userId.toString(),
        type: type,
        amount: amount.toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: newBalanceAmount.toString(),
        createdAt: new Date()
      });
    
    return updatedBalance;
  } catch (error) {
    console.error('Error updating user balance:', error);
    
    // Fallback to mock data in case of error
    const balanceBefore = mockBalance.balance;
    
    if (type === 'bet') {
      mockBalance.balance = Math.max(0, mockBalance.balance - amount);
    } else if (type === 'win' || type === 'deposit' || type === 'bonus') {
      mockBalance.balance += amount;
    }
    
    mockBalance.updatedAt = new Date();
    
    // Record transaction
    mockTransactions.push({
      id: mockTransactions.length + 1,
      userId: getGuestUserId(),
      type: type,
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: mockBalance.balance,
      createdAt: new Date()
    });
    
    return mockBalance as unknown as UserBalance;
  }
}

// Transactions
export async function getTransactionHistory(limit: number = 20): Promise<Transaction[]> {
  // Import required modules
  const { db } = await import('../db');
  const { transactions } = await import('../shared/schema');
  const { desc, eq } = await import('drizzle-orm');
  
  try {
    // Get current user (for now using fixed ID)
    const userId = 12; // This should be the ID of the logged-in user
    
    // Get transactions for the user, ordered by newest first
    const transactionHistory = await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId.toString()))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
    
    return transactionHistory;
  } catch (error) {
    console.error('Error getting transaction history:', error);
    // Fallback to mock data in case of error
    return mockTransactions.slice(0, limit) as unknown as Transaction[];
  }
}
