import { Express, Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { db } from '../db';
import { adminUsers, users, transactions, games, promotions, affiliates } from '@shared/schema';
import { eq, sql, desc, and, gt, lt, count } from 'drizzle-orm';
import { loginAdmin, adminAuth, requireRole, getAdminById } from './admin-auth-service';

const adminApiPrefix = '/api/admin';

export function registerAdminRoutes(app: Express) {
  // Admin authentication routes
  app.post(`${adminApiPrefix}/login`, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      console.log('Login attempt for username:', username);
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Check if admin exists in db
      const adminCheck = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
      console.log('Admin found in database:', adminCheck.length > 0 ? 'Yes' : 'No');
      
      if (adminCheck.length > 0) {
        // For debug only - log the stored password hash
        console.log('Stored hashed password:', adminCheck[0].password);
        console.log('Hashing input password...');
        
        // Hash the input password and compare
        const hashedInput = createHash('sha256').update(password).digest('hex');
        console.log('Input password hash:', hashedInput);
        console.log('Passwords match:', hashedInput === adminCheck[0].password);
      }
      
      const result = await loginAdmin(username, password);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Admin login error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Get current admin user
  app.get(`${adminApiPrefix}/me`, adminAuth, async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const admin = await getAdminById(adminId);
      
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      // Remove sensitive information
      const { password, ...adminData } = admin;
      
      return res.status(200).json(adminData);
    } catch (error: any) {
      console.error('Get admin error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Financial overview
  app.get(`${adminApiPrefix}/reports/financial-overview`, adminAuth, async (req: Request, res: Response) => {
    try {
      // Get date range parameters
      const { startDate, endDate } = req.query;
      
      // Default to current month if no dates provided
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const start = startDate ? new Date(startDate as string) : firstDayOfMonth;
      const end = endDate ? new Date(endDate as string) : lastDayOfMonth;
      
      // Previous period for comparison
      const previousPeriodStart = new Date(start);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      const previousPeriodEnd = new Date(end);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
      
      // Get current period data
      const depositsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'deposit'),
          gt(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        ) || undefined
      );
      
      const withdrawalsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'withdrawal'),
          gt(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        )
      );
      
      const betsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'bet'),
          gt(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        )
      );
      
      const winsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'win'),
          gt(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        )
      );
      
      // Get previous period data
      const previousDepositsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'deposit'),
          gt(transactions.createdAt, previousPeriodStart),
          lt(transactions.createdAt, previousPeriodEnd)
        )
      );
      
      const previousWithdrawalsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'withdrawal'),
          gt(transactions.createdAt, previousPeriodStart),
          lt(transactions.createdAt, previousPeriodEnd)
        )
      );
      
      const previousBetsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'bet'),
          gt(transactions.createdAt, previousPeriodStart),
          lt(transactions.createdAt, previousPeriodEnd)
        )
      );
      
      const previousWinsQuery = db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'win'),
          gt(transactions.createdAt, previousPeriodStart),
          lt(transactions.createdAt, previousPeriodEnd)
        )
      );
      
      // Execute all queries in parallel
      const [
        currentDeposits,
        currentWithdrawals,
        currentBets,
        currentWins,
        previousDeposits,
        previousWithdrawals,
        previousBets,
        previousWins
      ] = await Promise.all([
        db.select().from(depositsQuery.as('deposits')),
        db.select().from(withdrawalsQuery.as('withdrawals')),
        db.select().from(betsQuery.as('bets')),
        db.select().from(winsQuery.as('wins')),
        db.select().from(previousDepositsQuery.as('prev_deposits')),
        db.select().from(previousWithdrawalsQuery.as('prev_withdrawals')),
        db.select().from(previousBetsQuery.as('prev_bets')),
        db.select().from(previousWinsQuery.as('prev_wins'))
      ]);
      
      // Calculate GGR (Gross Gaming Revenue)
      const currentBetsTotal = parseFloat(currentBets[0].total || '0');
      const currentWinsTotal = parseFloat(currentWins[0].total || '0');
      const currentGGR = (currentBetsTotal - currentWinsTotal).toFixed(2);
      
      const previousBetsTotal = parseFloat(previousBets[0].total || '0');
      const previousWinsTotal = parseFloat(previousWins[0].total || '0');
      const previousGGR = (previousBetsTotal - previousWinsTotal).toFixed(2);
      
      return res.status(200).json({
        currentPeriod: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          deposits: currentDeposits[0],
          withdrawals: currentWithdrawals[0],
          bets: currentBets[0],
          wins: currentWins[0],
          ggr: currentGGR
        },
        previousPeriod: {
          startDate: previousPeriodStart.toISOString(),
          endDate: previousPeriodEnd.toISOString(),
          deposits: previousDeposits[0],
          withdrawals: previousWithdrawals[0],
          bets: previousBets[0],
          wins: previousWins[0],
          ggr: previousGGR
        }
      });
    } catch (error: any) {
      console.error('Financial overview error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // User registrations report
  app.get(`${adminApiPrefix}/reports/user-registrations`, adminAuth, async (req: Request, res: Response) => {
    try {
      // Get date range parameters
      const { startDate, endDate } = req.query;
      
      // Default to current month if no dates provided
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const start = startDate ? new Date(startDate as string) : firstDayOfMonth;
      const end = endDate ? new Date(endDate as string) : lastDayOfMonth;
      
      // Previous period for comparison
      const previousPeriodStart = new Date(start);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      const previousPeriodEnd = new Date(end);
      previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
      
      // Get total registrations for current period
      const currentRegistrationsQuery = db.select({
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(
        and(
          gt(users.createdAt, start),
          lt(users.createdAt, end)
        )
      );
      
      // Get total registrations for previous period
      const previousRegistrationsQuery = db.select({
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(
        and(
          gt(users.createdAt, previousPeriodStart),
          lt(users.createdAt, previousPeriodEnd)
        )
      );
      
      // Get daily registrations for the current period
      const dailyRegistrationsQuery = db.select({
        date: sql<string>`DATE(created_at)::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(
        and(
          gt(users.createdAt, start),
          lt(users.createdAt, end)
        )
      )
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);
      
      // Execute all queries in parallel
      const [currentRegistrations, previousRegistrations, dailyRegistrations] = await Promise.all([
        db.select().from(currentRegistrationsQuery.as('current_registrations')),
        db.select().from(previousRegistrationsQuery.as('previous_registrations')),
        db.select().from(dailyRegistrationsQuery.as('daily_registrations'))
      ]);
      
      return res.status(200).json({
        currentPeriod: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          count: currentRegistrations[0].count
        },
        previousPeriod: {
          startDate: previousPeriodStart.toISOString(),
          endDate: previousPeriodEnd.toISOString(),
          count: previousRegistrations[0].count
        },
        dailyData: dailyRegistrations
      });
    } catch (error: any) {
      console.error('User registrations report error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Game activity report
  app.get(`${adminApiPrefix}/reports/game-activity`, adminAuth, async (req: Request, res: Response) => {
    try {
      // Get most played games
      const topGamesQuery = db.select({
        gameId: transactions.gameId,
        gameName: games.name,
        totalBets: sql<number>`COUNT(*)`,
        totalWagered: sql<string>`COALESCE(SUM(CASE WHEN transactions.type = 'bet' THEN transactions.amount::numeric ELSE 0 END), 0)::text`,
        totalWon: sql<string>`COALESCE(SUM(CASE WHEN transactions.type = 'win' THEN transactions.amount::numeric ELSE 0 END), 0)::text`,
      })
      .from(transactions)
      .leftJoin(games, eq(transactions.gameId, games.id))
      .where(
        eq(transactions.type, 'bet')
      )
      .groupBy(transactions.gameId, games.name)
      .orderBy(sql`COUNT(*)`, 'desc')
      .limit(10);
      
      const topGames = await db.select().from(topGamesQuery.as('top_games'));
      
      // Calculate additional metrics for each game
      const gamesWithMetrics = topGames.map(game => {
        const totalWagered = parseFloat(game.totalWagered || '0');
        const totalWon = parseFloat(game.totalWon || '0');
        const rtp = totalWagered > 0 ? (totalWon / totalWagered * 100).toFixed(2) : '0';
        const ggr = (totalWagered - totalWon).toFixed(2);
        
        return {
          ...game,
          rtp,
          ggr
        };
      });
      
      return res.status(200).json({
        topGames: gamesWithMetrics
      });
    } catch (error: any) {
      console.error('Game activity report error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Players listing
  app.get(`${adminApiPrefix}/players`, adminAuth, async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '10', search } = req.query;
      
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * limitNumber;
      
      // Base query
      let query = db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
        balance: sql<string>`COALESCE(
          (SELECT SUM(CASE 
            WHEN transactions.type = 'deposit' OR transactions.type = 'win' THEN transactions.amount::numeric
            WHEN transactions.type = 'bet' OR transactions.type = 'withdrawal' THEN -transactions.amount::numeric
            ELSE 0
          END) FROM transactions WHERE transactions.user_id = users.id),
          0
        )::text`
      })
      .from(users);
      
      // Add search filter if provided
      if (search) {
        const searchTerm = `%${search}%`;
        query = query.where(
          sql`(username ILIKE ${searchTerm} OR email ILIKE ${searchTerm})`
        );
      }
      
      // Get total count for pagination
      const countQuery = db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(users);
      
      // Add same search filter to count query if provided
      if (search) {
        const searchTerm = `%${search}%`;
        countQuery.where(
          sql`(username ILIKE ${searchTerm} OR email ILIKE ${searchTerm})`
        );
      }
      
      // Execute queries
      const [playersResult, countResult] = await Promise.all([
        query.limit(limitNumber).offset(offset).orderBy(users.createdAt, 'desc'),
        db.select().from(countQuery.as('count'))
      ]);
      
      return res.status(200).json({
        players: playersResult,
        pagination: {
          total: countResult[0].count,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(countResult[0].count / limitNumber)
        }
      });
    } catch (error: any) {
      console.error('Players listing error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Get player details
  app.get(`${adminApiPrefix}/players/:id`, adminAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }
      
      // Get player details
      const player = await db.select().from(users).where(eq(users.id, parseInt(id, 10))).limit(1);
      
      if (!player.length) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Get player's balance
      const balanceQuery = db.select({
        balance: sql<string>`COALESCE(SUM(CASE 
          WHEN transactions.type = 'deposit' OR transactions.type = 'win' THEN transactions.amount::numeric
          WHEN transactions.type = 'bet' OR transactions.type = 'withdrawal' THEN -transactions.amount::numeric
          ELSE 0
        END), 0)::text`
      })
      .from(transactions)
      .where(eq(transactions.userId, parseInt(id, 10)));
      
      // Get recent transactions
      const recentTransactions = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, parseInt(id, 10)))
        .orderBy(desc(transactions.createdAt))
        .limit(20);
      
      // Get transaction summary
      const depositSum = await db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, parseInt(id, 10)),
          eq(transactions.type, 'deposit')
        )
      );
      
      const withdrawalSum = await db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, parseInt(id, 10)),
          eq(transactions.type, 'withdrawal')
        )
      );
      
      const betSum = await db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, parseInt(id, 10)),
          eq(transactions.type, 'bet')
        )
      );
      
      const winSum = await db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, parseInt(id, 10)),
          eq(transactions.type, 'win')
        )
      );
      
      const balanceResult = await db.select().from(balanceQuery.as('balance'));
      
      // Remove sensitive information
      const { password, ...playerData } = player[0];
      
      // Calculate net profit/loss
      const totalDeposits = parseFloat(depositSum[0].total || '0');
      const totalWithdrawals = parseFloat(withdrawalSum[0].total || '0');
      const totalBets = parseFloat(betSum[0].total || '0');
      const totalWins = parseFloat(winSum[0].total || '0');
      const profitLoss = (totalDeposits - totalWithdrawals - totalBets + totalWins).toFixed(2);
      
      return res.status(200).json({
        player: playerData,
        balance: balanceResult[0].balance,
        transactions: recentTransactions,
        summary: {
          totalDeposits: depositSum[0].total,
          totalWithdrawals: withdrawalSum[0].total,
          totalBets: betSum[0].total,
          totalWins: winSum[0].total,
          profitLoss
        }
      });
    } catch (error: any) {
      console.error('Player details error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Update player balance (add/remove funds)
  app.post(`${adminApiPrefix}/players/:id/balance`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, type, notes } = req.body;
      const adminId = req.user?.id;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
      
      if (!type || !['deposit', 'withdrawal'].includes(type)) {
        return res.status(400).json({ message: 'Type must be deposit or withdrawal' });
      }
      
      // Check if player exists
      const player = await db.select().from(users).where(eq(users.id, parseInt(id, 10))).limit(1);
      
      if (!player.length) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Create transaction
      const newTransaction = await db.insert(transactions).values({
        userId: parseInt(id, 10),
        type,
        amount: amount.toString(),
        status: 'completed',
        notes: notes || `Admin ${type} by admin ID: ${adminId}`
      }).returning();
      
      return res.status(200).json({
        message: `Successfully ${type === 'deposit' ? 'added' : 'removed'} funds`,
        transaction: newTransaction[0]
      });
    } catch (error: any) {
      console.error('Update player balance error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Update player status (lock/unlock account)
  app.post(`${adminApiPrefix}/players/:id/status`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const adminId = req.user?.id;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ message: 'Invalid player ID' });
      }
      
      if (!status || !['active', 'locked'].includes(status)) {
        return res.status(400).json({ message: 'Status must be active or locked' });
      }
      
      // Check if player exists
      const player = await db.select().from(users).where(eq(users.id, parseInt(id, 10))).limit(1);
      
      if (!player.length) {
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Update player status
      const updatedPlayer = await db.update(users)
        .set({ 
          isActive: status === 'active',
          notes: reason || `Account ${status === 'active' ? 'unlocked' : 'locked'} by admin ID: ${adminId}`
        })
        .where(eq(users.id, parseInt(id, 10)))
        .returning();
      
      // Remove sensitive information
      const { password, ...playerData } = updatedPlayer[0];
      
      return res.status(200).json({
        message: `Player account ${status === 'active' ? 'activated' : 'locked'} successfully`,
        player: playerData
      });
    } catch (error: any) {
      console.error('Update player status error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Get promotions
  app.get(`${adminApiPrefix}/promotions`, adminAuth, async (req: Request, res: Response) => {
    try {
      const allPromotions = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
      
      return res.status(200).json({
        promotions: allPromotions
      });
    } catch (error: any) {
      console.error('Get promotions error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Create promotion
  app.post(`${adminApiPrefix}/promotions`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    try {
      const { name, description, type, value, code, startDate, endDate, isActive } = req.body;
      
      if (!name || !description || !type || !value) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (!['bonus', 'cashback', 'freespin'].includes(type)) {
        return res.status(400).json({ message: 'Invalid promotion type' });
      }
      
      // Create new promotion
      const newPromotion = await db.insert(promotions).values({
        name,
        description,
        bonusType: type,
        bonusValue: value.toString(),
        maxBonus: req.body.maxBonus?.toString() || "0",
        minDeposit: req.body.minDeposit?.toString() || "0",
        wagerRequirement: parseInt(req.body.wagerRequirement?.toString() || "0"),
        maxUsagePerDay: req.body.maxUsagePerDay || 1,
        daysOfWeek: req.body.daysOfWeek || [0,1,2,3,4,5,6], // Default to all days
        timezone: req.body.timezone || "Australia/Sydney",
        active: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: req.user?.id || null
      }).returning();
      
      return res.status(201).json({
        message: 'Promotion created successfully',
        promotion: newPromotion[0]
      });
    } catch (error: any) {
      console.error('Create promotion error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Update promotion status
  app.patch(`${adminApiPrefix}/promotions/:id/status`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ message: 'Invalid promotion ID' });
      }
      
      if (isActive === undefined) {
        return res.status(400).json({ message: 'isActive status is required' });
      }
      
      // Check if promotion exists
      const promotion = await db.select().from(promotions).where(eq(promotions.id, parseInt(id, 10))).limit(1);
      
      if (!promotion.length) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
      
      // Update promotion status
      const updatedPromotion = await db.update(promotions)
        .set({ 
          isActive,
          updatedAt: new Date()
        })
        .where(eq(promotions.id, parseInt(id, 10)))
        .returning();
      
      return res.status(200).json({
        message: `Promotion ${isActive ? 'activated' : 'deactivated'} successfully`,
        promotion: updatedPromotion[0]
      });
    } catch (error: any) {
      console.error('Update promotion status error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Get affiliates
  app.get(`${adminApiPrefix}/affiliates`, adminAuth, async (_req: Request, res: Response) => {
    try {
      const allAffiliates = await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
      
      return res.status(200).json({
        affiliates: allAffiliates
      });
    } catch (error: any) {
      console.error('Get affiliates error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
}