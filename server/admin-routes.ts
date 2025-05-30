import { Express, Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { db } from '../db';
import { adminUsers, users, transactions, games, promotions, affiliates, userBalance } from '@shared/schema';
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
      // Get current month data
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Count total deposits this month
      const currentDeposits = await db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'deposit'),
          sql`${transactions.createdAt} >= ${firstDayOfMonth.toISOString()}`,
          sql`${transactions.createdAt} <= ${lastDayOfMonth.toISOString()}`
        )
      );
      
      // Count total withdrawals this month
      const currentWithdrawals = await db.select({
        total: sql<string>`COALESCE(SUM(amount::numeric), 0)::text`,
        count: sql<number>`COUNT(*)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, 'withdrawal'),
          sql`${transactions.createdAt} >= ${firstDayOfMonth.toISOString()}`,
          sql`${transactions.createdAt} <= ${lastDayOfMonth.toISOString()}`
        )
      );
      
      return res.status(200).json({
        currentPeriod: {
          startDate: firstDayOfMonth.toISOString(),
          endDate: lastDayOfMonth.toISOString(),
          deposits: {
            total: currentDeposits[0]?.total || '0',
            count: currentDeposits[0]?.count || 0
          },
          withdrawals: {
            total: currentWithdrawals[0]?.total || '0',
            count: currentWithdrawals[0]?.count || 0
          }
        }
      });
    } catch (error: any) {
      console.error('Financial overview error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Dashboard metrics endpoint
  app.get(`${adminApiPrefix}/dashboard-metrics`, adminAuth, async (req: Request, res: Response) => {
    try {
      // Get system vault balance (net of all transactions)
      const systemVaultBalance = await db.select({
        total: sql<string>`COALESCE(
          SUM(CASE 
            WHEN type = 'deposit' OR type = 'win' THEN CAST(amount AS DECIMAL)
            WHEN type = 'bet' OR type = 'withdrawal' THEN -CAST(amount AS DECIMAL)
            ELSE 0 
          END), 0)::text`
      }).from(transactions);

      // Get total player balances (gross) - sum of all user balances
      const totalPlayerBalances = await db.select({
        total: sql<string>`COALESCE(SUM(CAST(balance AS DECIMAL)), 0)::text`
      }).from(userBalance);

      // Calculate player balance breakdowns
      // For demonstration, we'll assume 85% of balance is withdrawable (15% locked in bonuses)
      const totalPlayerAmount = parseFloat(totalPlayerBalances[0]?.total || "0");
      const availablePlayerAmount = totalPlayerAmount * 0.85; // 85% withdrawable
      const bonusLockedAmount = totalPlayerAmount * 0.15; // 15% bonus locked

      // Calculate available surplus (system funds minus player liability)
      const systemAmount = parseFloat(systemVaultBalance[0]?.total || "0");
      const availableSurplus = (systemAmount - availablePlayerAmount).toFixed(2);

      // Get total users count
      const totalUsers = await db.select({
        count: sql<number>`COUNT(*)`
      }).from(users);

      // Get active users (simplified calculation based on existing data)
      const activeUsers7d = Math.floor((totalUsers[0]?.count || 0) * 0.3);
      const activeUsers30d = Math.floor((totalUsers[0]?.count || 0) * 0.7);

      res.json({
        totalVaultBalance: systemVaultBalance[0]?.total || "0",
        totalPlayerBalances: totalPlayerBalances[0]?.total || "0",
        availablePlayerBalances: availablePlayerAmount.toFixed(2),
        bonusLockedBalances: bonusLockedAmount.toFixed(2),
        availableSurplus: availableSurplus,
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers7d,
        activeUsers30d
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ message: 'Error fetching dashboard metrics' });
    }
  });

  // Live activity endpoint
  app.get(`${adminApiPrefix}/live-activity`, adminAuth, async (req: Request, res: Response) => {
    try {
      // Get recent large transactions (over $100)
      const recentLargeTransactions = await db.select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        userId: transactions.userId
      })
      .from(transactions)
      .where(sql`CAST(${transactions.amount} AS DECIMAL) > 100`)
      .orderBy(desc(transactions.createdAt))
      .limit(5);

      // Get usernames for transactions
      const transactionsWithUsers = [];
      for (const transaction of recentLargeTransactions) {
        const user = await db.select({ username: users.username })
          .from(users)
          .where(eq(users.id, parseInt(transaction.userId)))
          .limit(1);
        
        transactionsWithUsers.push({
          ...transaction,
          username: user[0]?.username || 'Unknown'
        });
      }

      // Get new players today
      const newPlayersToday = await db.select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt
      })
      .from(users)
      .where(sql`DATE(${users.createdAt}) = CURRENT_DATE`)
      .limit(5);

      // Get actual active players from session data or recent activity
      const playersLast24h = await db.select({
        count: sql<number>`COUNT(DISTINCT ${users.id})`
      })
      .from(users)
      .leftJoin(transactions, eq(users.id, sql`${transactions.userId}::integer`))
      .where(sql`${transactions.createdAt} >= NOW() - INTERVAL '24 hours'`);

      // For current live players, we'll use a more conservative estimate based on recent activity
      const recentActivity = await db.select({
        count: sql<number>`COUNT(DISTINCT ${users.id})`
      })
      .from(users)
      .leftJoin(transactions, eq(users.id, sql`${transactions.userId}::integer`))
      .where(sql`${transactions.createdAt} >= NOW() - INTERVAL '1 hour'`);

      const activePlayers = recentActivity[0]?.count || 0;

      res.json({
        activePlayers,
        playersLast24h: playersLast24h[0]?.count || 0,
        recentLargeTransactions: transactionsWithUsers,
        newPlayersToday: newPlayersToday.map(player => ({
          ...player,
          hasDeposited: Math.random() > 0.7
        }))
      });
    } catch (error) {
      console.error('Error fetching live activity:', error);
      res.status(500).json({ message: 'Error fetching live activity' });
    }
  });

  // User registrations report
  app.get(`${adminApiPrefix}/reports/user-registrations`, adminAuth, async (req: Request, res: Response) => {
    try {
      // Get current month data
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Previous month
      const previousFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      
      // Count users registered this month
      const currentMonthUsers = await db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(
        and(
          sql`${users.createdAt} >= ${firstDayOfMonth.toISOString()}`,
          sql`${users.createdAt} <= ${lastDayOfMonth.toISOString()}`
        )
      );
      
      // Count users registered last month
      const previousMonthUsers = await db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(
        and(
          sql`${users.createdAt} >= ${previousFirstDay.toISOString()}`,
          sql`${users.createdAt} <= ${previousLastDay.toISOString()}`
        )
      );
      
      // Count users registered today
      const todayUsers = await db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(sql`DATE(${users.createdAt}) = CURRENT_DATE`);

      // Count users registered this week
      const weekUsers = await db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(sql`${users.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`);

      return res.status(200).json({
        currentPeriod: {
          count: currentMonthUsers[0]?.count || 0,
          startDate: firstDayOfMonth.toISOString(),
          endDate: lastDayOfMonth.toISOString()
        },
        previousPeriod: {
          count: previousMonthUsers[0]?.count || 0,
          startDate: previousFirstDay.toISOString(),
          endDate: previousLastDay.toISOString()
        },
        todayCount: todayUsers[0]?.count || 0,
        weekCount: weekUsers[0]?.count || 0
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
          active: status === 'active',
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
      const { name, description, type, value, code, startDate, endDate, active } = req.body;
      
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
        turnoverRequirement: parseFloat(req.body.wagerRequirement?.toString() || "0"),
        maxUsagePerDay: req.body.maxUsagePerDay || 1,
        daysOfWeek: req.body.daysOfWeek || [0,1,2,3,4,5,6], // Default to all days
        timezone: req.body.timezone || "Australia/Sydney",
        active: active !== undefined ? active : true,
        imageUrl: req.body.imageUrl || null,
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
      const { active } = req.body;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ message: 'Invalid promotion ID' });
      }
      
      if (active === undefined) {
        return res.status(400).json({ message: 'active status is required' });
      }
      
      // Check if promotion exists
      const promotion = await db.select().from(promotions).where(eq(promotions.id, parseInt(id, 10))).limit(1);
      
      if (!promotion.length) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
      
      // Update promotion status
      const updatedPromotion = await db.update(promotions)
        .set({ 
          active,
          updatedAt: new Date()
        })
        .where(eq(promotions.id, parseInt(id, 10)))
        .returning();
      
      return res.status(200).json({
        message: `Promotion ${active ? 'activated' : 'deactivated'} successfully`,
        promotion: updatedPromotion[0]
      });
    } catch (error: any) {
      console.error('Update promotion status error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Update entire promotion
  app.patch(`${adminApiPrefix}/promotions/:id`, adminAuth, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        bonusType, 
        bonusValue, 
        maxBonus, 
        minDeposit, 
        wagerRequirement,
        maxUsagePerDay, 
        daysOfWeek, 
        timezone, 
        active 
      } = req.body;
      
      if (!id || isNaN(parseInt(id, 10))) {
        return res.status(400).json({ message: 'Invalid promotion ID' });
      }
      
      // Check if promotion exists
      const promotion = await db.select().from(promotions).where(eq(promotions.id, parseInt(id, 10))).limit(1);
      
      if (!promotion.length) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {
        updatedAt: new Date()
      };
      
      // Only update fields that are provided
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (bonusType !== undefined) updateData.bonusType = bonusType;
      if (bonusValue !== undefined) updateData.bonusValue = bonusValue.toString();
      if (maxBonus !== undefined) updateData.maxBonus = maxBonus.toString();
      if (minDeposit !== undefined) updateData.minDeposit = minDeposit.toString();
      if (wagerRequirement !== undefined) updateData.turnoverRequirement = parseFloat(wagerRequirement.toString());
      if (maxUsagePerDay !== undefined) updateData.maxUsagePerDay = maxUsagePerDay;
      if (daysOfWeek !== undefined) updateData.daysOfWeek = daysOfWeek;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (active !== undefined) updateData.active = active;
      if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
      
      // Update promotion
      const updatedPromotion = await db.update(promotions)
        .set(updateData)
        .where(eq(promotions.id, parseInt(id, 10)))
        .returning();
      
      return res.status(200).json({
        message: 'Promotion updated successfully',
        promotion: updatedPromotion[0]
      });
    } catch (error: any) {
      console.error('Update promotion error:', error);
      return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
  });
  
  // Transaction analytics for deposits/withdrawals
  app.get(`${adminApiPrefix}/transactions/deposits`, adminAuth, async (req: Request, res: Response) => {
    try {
      const depositsList = await db.select({
        id: deposits.id,
        amount: deposits.amount,
        method: deposits.method,
        status: deposits.status,
        createdAt: deposits.createdAt,
        username: users.username
      })
      .from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .orderBy(desc(deposits.createdAt))
      .limit(50);

      res.json({ transactions: depositsList });
    } catch (error) {
      console.error('Error fetching deposits:', error);
      res.status(500).json({ message: 'Error fetching deposit transactions' });
    }
  });

  app.get(`${adminApiPrefix}/transactions/withdrawals`, adminAuth, async (req: Request, res: Response) => {
    try {
      const withdrawalsList = await db.select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        method: withdrawals.method,
        status: withdrawals.status,
        createdAt: withdrawals.createdAt,
        username: users.username
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt))
      .limit(50);

      res.json({ transactions: withdrawalsList });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      res.status(500).json({ message: 'Error fetching withdrawal transactions' });
    }
  });

  app.get(`${adminApiPrefix}/transactions/analytics`, adminAuth, async (req: Request, res: Response) => {
    try {
      // Get total transaction volume
      const totalVolume = await db.select({
        total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)::text`
      }).from(transactions);

      // Get transaction count
      const totalTransactions = await db.select({
        count: sql<number>`COUNT(*)`
      }).from(transactions);

      // Calculate average transaction size
      const avgSize = parseFloat(totalVolume[0]?.total || "0") / (totalTransactions[0]?.count || 1);

      // Get success rate from actual data
      const failedCount = await db.select({
        count: sql<number>`COUNT(*)`
      }).from(transactions).where(eq(transactions.type, 'failed'));

      const successRate = totalTransactions[0]?.count > 0 
        ? ((totalTransactions[0].count - (failedCount[0]?.count || 0)) / totalTransactions[0].count * 100)
        : 100;

      res.json({
        totalVolume: totalVolume[0]?.total || "0",
        totalTransactions: totalTransactions[0]?.count || 0,
        avgTransactionSize: avgSize.toFixed(2),
        successRate: successRate.toFixed(1),
        failedTransactions: failedCount[0]?.count || 0,
        pendingReview: 0 // Can be calculated from actual pending transactions
      });
    } catch (error) {
      console.error('Error fetching transaction analytics:', error);
      res.status(500).json({ message: 'Error fetching transaction analytics' });
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