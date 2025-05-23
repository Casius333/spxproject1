import { Request, Response } from "express";
import * as storage from "../storage";
import { z } from "zod";
import { db } from "../../db";
import { userPromotions, transactions } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

// Validation schema for balance update
const updateBalanceSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  action: z.enum(["bet", "win", "deposit", "bonus"], {
    errorMap: () => ({ message: "Action must be one of: bet, win, deposit, bonus" }),
  }),
});

// Function to check if user has active promotions
async function getUserActivePromotions(userId: number) {
  try {
    console.log(`Checking active promotions for user ${userId}`);
    
    // Find active promotions for the user
    const activePromotions = await db.select()
      .from(userPromotions)
      .where(
        and(
          eq(userPromotions.userId, userId),
          eq(userPromotions.status, 'active')
        )
      );
    
    console.log(`Found ${activePromotions.length} active promotions for user ${userId}`);
    
    // Additionally log each promotion's details for debugging
    if (activePromotions.length > 0) {
      activePromotions.forEach((promo, index) => {
        console.log(`Promotion ${index + 1}: ID=${promo.id}, bonusAmount=${promo.bonusAmount}, status=${promo.status}`);
      });
    }
    
    return activePromotions;
  } catch (error) {
    console.error("Error getting active promotions:", error);
    return [];
  }
}

// Function to calculate bonus and real money breakdown
export async function getBalanceBreakdown(userId: number, totalBalance: number) {
  try {
    // Get active promotions to determine bonus amount
    const activePromotions = await getUserActivePromotions(userId);
    
    let bonusBalance = 0;
    let hasActiveBonus = false;
    
    // Log for debugging
    console.log(`Getting balance breakdown for user ${userId}, found ${activePromotions.length} active promotions`);
    
    // Sum up all bonus amounts from active promotions
    for (const promotion of activePromotions) {
      const bonusAmount = parseFloat(promotion.bonusAmount);
      console.log(`Found active promotion with bonus amount: ${bonusAmount}`);
      bonusBalance += bonusAmount;
      hasActiveBonus = true;
    }
    
    // Cap bonus balance at total balance
    bonusBalance = Math.min(bonusBalance, totalBalance);
    
    // Real money is the rest
    const realBalance = totalBalance - bonusBalance;
    
    // When bonus is active, no funds are available for withdrawal
    // IMPORTANT: This is the key fix - when a user has an active bonus, 
    // they should not be able to withdraw ANY funds until the wagering is complete
    const availableForWithdrawal = hasActiveBonus ? 0 : realBalance;
    
    console.log(`Balance breakdown: Total: ${totalBalance}, Real: ${realBalance}, Bonus: ${bonusBalance}, Available: ${availableForWithdrawal}, HasBonus: ${hasActiveBonus}`);
    
    return {
      bonusBalance,
      realBalance,
      availableForWithdrawal,
      hasActiveBonus
    };
  } catch (error) {
    console.error("Error calculating balance breakdown:", error);
    
    // Default to all real money if there's an error, but no withdrawal if there was an error
    // This is safer than allowing potential withdrawal of locked funds
    return {
      bonusBalance: 0,
      realBalance: totalBalance,
      availableForWithdrawal: 0, // Changed to 0 as a safety measure
      hasActiveBonus: false
    };
  }
}

// Function to calculate bonus and real money amounts for betting
// For bets, we use real money first, then bonus money
async function calculateBetBreakdown(userId: number, betAmount: number, totalBalance: number) {
  const { bonusBalance, realBalance } = await getBalanceBreakdown(userId, totalBalance);
  
  // Use real balance first, then bonus
  const realMoneyUsed = Math.min(betAmount, realBalance);
  const bonusMoneyUsed = Math.max(0, betAmount - realMoneyUsed);
  
  return {
    realMoneyUsed,
    bonusMoneyUsed
  };
}

// Direct export of the function for direct imports
export async function updateUserBalance(userId: number, amount: number, type: 'bet' | 'win' | 'deposit' | 'bonus'): Promise<any> {
  try {
    return await storage.updateUserBalance(userId, amount, type);
  } catch (error) {
    console.error("Error updating user balance:", error);
    throw error;
  }
}

export const balanceController = {
  // Get user balance
  getBalance: async (req: Request, res: Response) => {
    try {
      const userBalance = await storage.getUserBalance();
      
      // If no balance record exists yet, return default
      if (!userBalance) {
        return res.status(200).json({ 
          balance: 1000,
          bonusBalance: 0,
          realBalance: 1000,
          availableForWithdrawal: 1000,
          hasActiveBonus: false
        });
      }
      
      const totalBalance = parseFloat(userBalance.balance.toString());
      const userId = 12; // This should come from auth
      
      // Get bonus balance and other details
      const balanceDetails = await getBalanceBreakdown(userId, totalBalance);
      
      return res.status(200).json({ 
        balance: totalBalance,
        ...balanceDetails
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
      return res.status(500).json({ message: "Failed to fetch balance" });
    }
  },

  // Update user balance
  updateBalance: async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = updateBalanceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors,
        });
      }
      
      const { amount, action } = validationResult.data;
      const userId = 12; // This should come from auth
      
      // Ensure bet doesn't exceed balance
      if (action === "bet") {
        const currentBalance = await storage.getUserBalance();
        
        if (currentBalance && parseFloat(currentBalance.balance.toString()) < amount) {
          return res.status(400).json({ 
            message: "Insufficient balance" 
          });
        }
      }
      
      // Update balance
      const updatedBalance = await storage.updateUserBalance(userId, amount, action);
      const totalBalance = parseFloat(updatedBalance.balance.toString());
      
      // Get bonus balance and other details
      const balanceDetails = await getBalanceBreakdown(userId, totalBalance);
      
      // Broadcast balance update via Socket.IO if available
      const io = req.app.get('socketio');
      if (io) {
        try {
          // Import the broadcastBalanceUpdate function from routes.ts
          const { broadcastBalanceUpdate } = await import('../routes');
          
          // Broadcast the update
          await broadcastBalanceUpdate(
            io,
            userId,
            totalBalance,
            balanceDetails,
            action,
            amount
          );
        } catch (socketError) {
          console.error('Failed to broadcast balance update:', socketError);
          // Continue anyway - socket error shouldn't prevent API response
        }
      }
      
      return res.status(200).json({
        balance: totalBalance,
        ...balanceDetails,
        action,
        amount,
      });
    } catch (error) {
      console.error("Error updating balance:", error);
      return res.status(500).json({ message: "Failed to update balance" });
    }
  },

  // Get transaction history
  getTransactions: async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: "Invalid limit parameter" });
      }
      
      const transactions = await storage.getTransactionHistory(limit);
      
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  },
  
  // Expose utility functions through controller
  getBalanceBreakdown,
  updateUserBalance
};