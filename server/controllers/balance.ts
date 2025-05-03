import { Request, Response } from "express";
import * as storage from "../storage";
import { z } from "zod";

// Validation schema for balance update
const updateBalanceSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  action: z.enum(["bet", "win", "deposit"], {
    errorMap: () => ({ message: "Action must be one of: bet, win, deposit" }),
  }),
});

export const balanceController = {
  // Get user balance
  getBalance: async (req: Request, res: Response) => {
    try {
      const userBalance = await storage.getUserBalance();
      
      // If no balance record exists yet, return default
      if (!userBalance) {
        return res.status(200).json({ balance: 1000 });
      }
      
      return res.status(200).json({ 
        balance: parseFloat(userBalance.balance.toString())
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
      const updatedBalance = await storage.updateUserBalance(amount, action);
      
      return res.status(200).json({
        balance: parseFloat(updatedBalance.balance.toString()),
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
};
