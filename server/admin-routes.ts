import { Express, Request, Response } from 'express';
import { adminAuth, requireRole, loginAdmin, createAdmin, getAdminById } from './admin-auth-service';
import { db } from '../db';
import { desc, eq, and, gte, lte, sql, like, or } from 'drizzle-orm';
import {
  users,
  userBalance,
  transactions,
  games,
  categories,
  adminUsers,
  promotions,
  deposits,
  withdrawals,
  playerActivity,
  adminActionLogs
} from '../shared/schema';

export function registerAdminRoutes(app: Express) {
  const adminApiPrefix = '/api/admin';
  
  // Admin authentication routes
  app.post(`${adminApiPrefix}/login`, async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const result = await loginAdmin(username, password);
    
    if (!result) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Send the admin data and token
    return res.status(200).json({
      admin: {
        id: result.admin.id,
        username: result.admin.username,
        email: result.admin.email,
        role: result.admin.role
      },
      token: result.token
    });
  });
  
  // Get current admin
  app.get(`${adminApiPrefix}/me`, adminAuth, async (req: Request, res: Response) => {
    const adminId = (req as any).admin.id;
    const admin = await getAdminById(adminId);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    return res.status(200).json({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      lastLogin: admin.lastLogin
    });
  });
  
  // REPORTS SECTION
  
  // Financial overview report
  app.get(`${adminApiPrefix}/reports/financial-overview`, adminAuth, async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    // Create a condition that is always true if no date range is provided
    let dateCondition = sql`1=1`;
    
    if (startDate && endDate) {
      dateCondition = and(
        gte(transactions.createdAt, new Date(startDate as string)),
        lte(transactions.createdAt, new Date(endDate as string))
      );
    }
    
    try {
      // Get total deposits
      const depositsResult = await db.select({
        total: sql<string>`SUM(amount)`.as('total'),
        count: sql<number>`COUNT(*)`.as('count')
      }).from(transactions)
        .where(and(eq(transactions.type, 'deposit'), dateCondition));
      
      // Get total withdrawals (for a real app - this would be from withdrawals table)
      const withdrawalsResult = await db.select({
        total: sql<string>`SUM(amount)`.as('total'),
        count: sql<number>`COUNT(*)`.as('count')
      }).from(transactions)
        .where(and(eq(transactions.type, 'withdrawal'), dateCondition));
      
      // Get total bets
      const betsResult = await db.select({
        total: sql<string>`SUM(amount)`.as('total'),
        count: sql<number>`COUNT(*)`.as('count')
      }).from(transactions)
        .where(and(eq(transactions.type, 'bet'), dateCondition));
      
      // Get total wins
      const winsResult = await db.select({
        total: sql<string>`SUM(amount)`.as('total'),
        count: sql<number>`COUNT(*)`.as('count')
      }).from(transactions)
        .where(and(eq(transactions.type, 'win'), dateCondition));
      
      // Calculate GGR (Gross Gaming Revenue)
      const betsTotal = parseFloat(betsResult[0]?.total || '0');
      const winsTotal = parseFloat(winsResult[0]?.total || '0');
      const ggr = betsTotal - winsTotal;
      
      return res.status(200).json({
        deposits: {
          total: depositsResult[0]?.total || '0',
          count: depositsResult[0]?.count || 0
        },
        withdrawals: {
          total: withdrawalsResult[0]?.total || '0',
          count: withdrawalsResult[0]?.count || 0
        },
        bets: {
          total: betsResult[0]?.total || '0',
          count: betsResult[0]?.count || 0
        },
        wins: {
          total: winsResult[0]?.total || '0',
          count: winsResult[0]?.count || 0
        },
        ggr: ggr.toString(),
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      });
    } catch (error) {
      console.error('Error generating financial overview:', error);
      return res.status(500).json({ message: 'Failed to generate financial overview' });
    }
  });
  
  // User registrations report
  app.get(`${adminApiPrefix}/reports/user-registrations`, adminAuth, async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    // Create a condition that is always true if no date range is provided
    let dateCondition = sql`1=1`;
    
    if (startDate && endDate) {
      dateCondition = and(
        gte(users.createdAt, new Date(startDate as string)),
        lte(users.createdAt, new Date(endDate as string))
      );
    }
    
    try {
      // Get daily registrations
      const dailyRegistrations = await db.select({
        date: sql<string>`DATE(${users.createdAt})`.as('date'),
        count: sql<number>`COUNT(*)`.as('count')
      }).from(users)
        .where(dateCondition)
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(sql`DATE(${users.createdAt})`);
      
      // Get total registrations
      const totalRegistrations = await db.select({
        count: sql<number>`COUNT(*)`.as('count')
      }).from(users)
        .where(dateCondition);
      
      return res.status(200).json({
        totalRegistrations: totalRegistrations[0]?.count || 0,
        dailyRegistrations,
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      });
    } catch (error) {
      console.error('Error generating user registrations report:', error);
      return res.status(500).json({ message: 'Failed to generate user registrations report' });
    }
  });
  
  // Game activity report
  app.get(`${adminApiPrefix}/reports/game-activity`, adminAuth, async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    // Create a condition that is always true if no date range is provided
    let dateCondition = sql`1=1`;
    
    if (startDate && endDate) {
      dateCondition = and(
        gte(transactions.createdAt, new Date(startDate as string)),
        lte(transactions.createdAt, new Date(endDate as string))
      );
    }
    
    try {
      // Get most played games
      const mostPlayedGames = await db.select({
        gameId: transactions.gameId,
        gameTitle: games.title,
        playCount: sql<number>`COUNT(*)`.as('play_count'),
        totalBets: sql<string>`SUM(CASE WHEN ${transactions.type} = 'bet' THEN ${transactions.amount} ELSE 0 END)`.as('total_bets'),
        totalWins: sql<string>`SUM(CASE WHEN ${transactions.type} = 'win' THEN ${transactions.amount} ELSE 0 END)`.as('total_wins')
      }).from(transactions)
        .leftJoin(games, eq(transactions.gameId, games.id))
        .where(and(
          dateCondition,
          sql`${transactions.gameId} IS NOT NULL`
        ))
        .groupBy(transactions.gameId, games.title)
        .orderBy(desc(sql`play_count`))
        .limit(10);
      
      return res.status(200).json({
        mostPlayedGames,
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      });
    } catch (error) {
      console.error('Error generating game activity report:', error);
      return res.status(500).json({ message: 'Failed to generate game activity report' });
    }
  });
  
  // PLAYERS SECTION
  
  // Get all players with pagination
  app.get(`${adminApiPrefix}/players`, adminAuth, async (req: Request, res: Response) => {
    const { page = '1', limit = '10', search = '' } = req.query;
    
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const offset = (pageNumber - 1) * limitNumber;
    
    try {
      let whereClause = sql`1=1`; // Default true condition
      if (search && typeof search === 'string' && search.trim() !== '') {
        whereClause = or(
          like(users.username, `%${search}%`),
          like(users.email, `%${search}%`)
        );
      }
      
      // Get users with their balance
      const players = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
        balance: userBalance.balance
      }).from(users)
        .leftJoin(userBalance, eq(users.id, userBalance.userId))
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limitNumber)
        .offset(offset);
      
      // Get total count for pagination
      const countResult = await db.select({
        count: sql<number>`COUNT(*)`.as('count')
      }).from(users)
        .where(whereClause);
      
      return res.status(200).json({
        players,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: countResult[0]?.count || 0,
          totalPages: Math.ceil((countResult[0]?.count || 0) / limitNumber)
        }
      });
    } catch (error) {
      console.error('Error fetching players:', error);
      return res.status(500).json({ message: 'Failed to fetch players' });
    }
  });
  
  // Get player details
  app.get(`${adminApiPrefix}/players/:id`, adminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      // Get user details
      const userResult = await db.select().from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);
      
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      const user = userResult[0];
      
      // Get balance
      const balanceResult = await db.select().from(userBalance)
        .where(eq(userBalance.userId, id))
        .limit(1);
      
      // Get recent transactions
      const recentTransactions = await db.select().from(transactions)
        .where(eq(transactions.userId, id))
        .orderBy(desc(transactions.createdAt))
        .limit(20);
      
      // Get player activity
      const playerActivities = await db.select().from(playerActivity)
        .where(eq(playerActivity.userId, parseInt(id)))
        .orderBy(desc(playerActivity.createdAt))
        .limit(20);
      
      return res.status(200).json({
        user: {
          ...user,
          balance: balanceResult[0]?.balance || '0'
        },
        recentTransactions,
        playerActivities
      });
    } catch (error) {
      console.error('Error fetching player details:', error);
      return res.status(500).json({ message: 'Failed to fetch player details' });
    }
  });
  
  // Update player balance
  app.post(`${adminApiPrefix}/players/:id/balance`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, type, reason } = req.body;
    
    if (!amount || !type || !['add', 'subtract'].includes(type)) {
      return res.status(400).json({ message: 'Invalid request. Amount and type (add/subtract) are required' });
    }
    
    try {
      // Get current balance
      const balanceResult = await db.select().from(userBalance)
        .where(eq(userBalance.userId, id))
        .limit(1);
      
      if (balanceResult.length === 0) {
        return res.status(404).json({ message: 'Player balance not found' });
      }
      
      const currentBalance = parseFloat(balanceResult[0].balance);
      const adjustmentAmount = parseFloat(amount);
      
      if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
      
      // Calculate new balance
      let newBalance = currentBalance;
      if (type === 'add') {
        newBalance += adjustmentAmount;
      } else {
        if (currentBalance < adjustmentAmount) {
          return res.status(400).json({ message: 'Insufficient balance for deduction' });
        }
        newBalance -= adjustmentAmount;
      }
      
      // Update balance
      await db.update(userBalance)
        .set({ balance: newBalance.toString(), updatedAt: new Date() })
        .where(eq(userBalance.userId, id));
      
      // Record transaction
      await db.insert(transactions).values({
        userId: id,
        type: type === 'add' ? 'deposit' : 'withdrawal',
        amount: adjustmentAmount.toString(),
        balanceBefore: currentBalance.toString(),
        balanceAfter: newBalance.toString()
      });
      
      // Log admin action
      const adminId = (req as any).admin.id;
      await db.insert(adminActionLogs).values({
        adminId,
        actionType: 'balance_adjustment',
        details: {
          userId: id,
          adjustmentType: type,
          amount: adjustmentAmount,
          reason: reason || 'Manual adjustment',
          previousBalance: currentBalance,
          newBalance
        },
        ipAddress: req.ip
      });
      
      return res.status(200).json({
        message: `Balance ${type === 'add' ? 'increased' : 'decreased'} successfully`,
        newBalance: newBalance.toString()
      });
    } catch (error) {
      console.error('Error updating player balance:', error);
      return res.status(500).json({ message: 'Failed to update player balance' });
    }
  });
  
  // Suspend/Unsuspend player (placeholder - would update user status in a real app)
  app.post(`${adminApiPrefix}/players/:id/status`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    // This is a placeholder since we don't have a status field in the users table
    // In a real application, you would update the user's status
    return res.status(200).json({ message: 'Player status updated' });
  });
  
  // PROMOTIONS SECTION
  
  // Get all promotions
  app.get(`${adminApiPrefix}/promotions`, adminAuth, async (req: Request, res: Response) => {
    try {
      const allPromotions = await db.select({
        id: promotions.id,
        name: promotions.name,
        description: promotions.description,
        bonusType: promotions.bonusType,
        bonusValue: promotions.bonusValue,
        minDeposit: promotions.minDeposit,
        maxBonus: promotions.maxBonus,
        turnoverRequirement: promotions.turnoverRequirement,
        startDate: promotions.startDate,
        endDate: promotions.endDate,
        isActive: promotions.isActive,
        imageUrl: promotions.imageUrl,
        createdAt: promotions.createdAt,
        createdByUsername: adminUsers.username
      }).from(promotions)
        .leftJoin(adminUsers, eq(promotions.createdBy, adminUsers.id))
        .orderBy(desc(promotions.createdAt));
      
      return res.status(200).json(allPromotions);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return res.status(500).json({ message: 'Failed to fetch promotions' });
    }
  });
  
  // Create a new promotion
  app.post(`${adminApiPrefix}/promotions`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    const {
      name,
      description,
      bonusType,
      bonusValue,
      minDeposit,
      maxBonus,
      turnoverRequirement,
      startDate,
      endDate,
      imageUrl
    } = req.body;
    
    // Basic validation
    if (!name || !bonusType || !bonusValue || !minDeposit || !turnoverRequirement || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    try {
      const adminId = (req as any).admin.id;
      
      // Create promotion
      const result = await db.insert(promotions).values({
        name,
        description,
        bonusType,
        bonusValue: bonusValue.toString(),
        minDeposit: minDeposit.toString(),
        maxBonus: maxBonus ? maxBonus.toString() : null,
        turnoverRequirement: turnoverRequirement.toString(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrl,
        createdBy: adminId,
        isActive: true
      }).returning();
      
      // Log admin action
      await db.insert(adminActionLogs).values({
        adminId,
        actionType: 'promotion_create',
        details: {
          promotionId: result[0].id,
          promotionName: name,
          bonusType,
          bonusValue
        },
        ipAddress: req.ip
      });
      
      return res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error creating promotion:', error);
      return res.status(500).json({ message: 'Failed to create promotion' });
    }
  });
  
  // Update promotion status (activate/deactivate)
  app.patch(`${adminApiPrefix}/promotions/:id/status`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined || isActive === null) {
      return res.status(400).json({ message: 'isActive status is required' });
    }
    
    try {
      const adminId = (req as any).admin.id;
      
      // Update promotion status
      const result = await db.update(promotions)
        .set({
          isActive: Boolean(isActive),
          updatedAt: new Date()
        })
        .where(eq(promotions.id, parseInt(id)))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
      
      // Log admin action
      await db.insert(adminActionLogs).values({
        adminId,
        actionType: 'promotion_status_update',
        details: {
          promotionId: parseInt(id),
          promotionName: result[0].name,
          newStatus: Boolean(isActive)
        },
        ipAddress: req.ip
      });
      
      return res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error updating promotion status:', error);
      return res.status(500).json({ message: 'Failed to update promotion status' });
    }
  });
  
  // AFFILIATE SECTION (placeholder)
  
  app.get(`${adminApiPrefix}/affiliates`, adminAuth, async (_req: Request, res: Response) => {
    // This is a placeholder for the future affiliate system
    return res.status(200).json([
      { id: 1, name: 'Affiliate Program 1', code: 'AFF001', commission: '5.00', isActive: true },
      { id: 2, name: 'Affiliate Program 2', code: 'AFF002', commission: '7.50', isActive: true },
    ]);
  });
}