import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Seed categories
    const categories = [
      { name: "All Slots", slug: "all-slots" },
      { name: "New Games", slug: "new-games" },
      { name: "Popular", slug: "popular" },
      { name: "Jackpots", slug: "jackpots" },
      { name: "Megaways", slug: "megaways" },
      { name: "Classic Slots", slug: "classic-slots" },
      { name: "Bonus Buy", slug: "bonus-buy" },
      { name: "Fruit Slots", slug: "fruit-slots" }
    ];

    // Check if categories already exist
    const existingCategories = await db.query.categories.findMany();
    if (existingCategories.length === 0) {
      console.log("Seeding categories...");
      for (const category of categories) {
        await db.insert(schema.categories).values(category);
      }
    } else {
      console.log("Categories already exist, skipping...");
    }

    // Get category IDs for relationships
    const allCategories = await db.query.categories.findMany();
    const categoryMap = new Map(allCategories.map(cat => [cat.slug, cat.id]));

    // Seed games
    const games = [
      {
        title: "Money Train 3",
        slug: "money-train-3",
        provider: "Relax Gaming",
        description: "Embark on a wild west adventure with huge potential wins.",
        image: "https://images.unsplash.com/photo-1636571815396-2442f7c0c042?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("all-slots")!,
        isFeatured: true,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 96.5,
        volatility: "high",
        minBet: 0.1,
        maxBet: 100
      },
      {
        title: "Aztec Gold",
        slug: "aztec-gold",
        provider: "Pragmatic Play",
        description: "Discover the treasures of ancient Aztec civilization.",
        image: "https://images.unsplash.com/photo-1641824072053-9bb798235322?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("new-games")!,
        isFeatured: true,
        isPopular: false,
        isNew: true,
        isJackpot: false,
        rtp: 95.8,
        volatility: "medium",
        minBet: 0.2,
        maxBet: 100
      },
      {
        title: "Sweet Bonanza",
        slug: "sweet-bonanza",
        provider: "Pragmatic Play",
        description: "Indulge in a world of candy and win sweet prizes.",
        image: "https://images.unsplash.com/photo-1640445233924-07b426de0808?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("popular")!,
        isFeatured: true,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 96.2,
        volatility: "high",
        minBet: 0.2,
        maxBet: 125
      },
      {
        title: "Wolf Gold",
        slug: "wolf-gold",
        provider: "Pragmatic Play",
        description: "Howl at the moon and chase massive jackpots in this wildlife adventure.",
        image: "https://images.unsplash.com/photo-1606248156496-f784bc1fabe4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("jackpots")!,
        isFeatured: true,
        isPopular: false,
        isNew: false,
        isJackpot: true,
        jackpotAmount: 87650.25,
        rtp: 96.0,
        volatility: "medium",
        minBet: 0.25,
        maxBet: 125
      },
      {
        title: "Gonzo's Quest",
        slug: "gonzos-quest",
        provider: "NetEnt",
        description: "Join Gonzo on his quest for El Dorado and great riches.",
        image: "https://images.unsplash.com/photo-1612404730960-5c71577fca11?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("all-slots")!,
        isFeatured: true,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 95.9,
        volatility: "medium",
        minBet: 0.2,
        maxBet: 50
      },
      {
        title: "Mega Moolah",
        slug: "mega-moolah",
        provider: "Microgaming",
        description: "The world's most famous progressive jackpot slot.",
        image: "https://images.unsplash.com/photo-1642133875728-94c7e8b9756a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("jackpots")!,
        isFeatured: false,
        isPopular: false,
        isNew: false,
        isJackpot: true,
        jackpotAmount: 4234567.12,
        rtp: 88.1,
        volatility: "high",
        minBet: 0.25,
        maxBet: 6.25
      },
      {
        title: "Divine Fortune",
        slug: "divine-fortune",
        provider: "NetEnt",
        description: "Greek mythology-themed progressive jackpot slot.",
        image: "https://images.unsplash.com/photo-1605870445919-838d190e8e1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("jackpots")!,
        isFeatured: false,
        isPopular: false,
        isNew: false,
        isJackpot: true,
        jackpotAmount: 589342.75,
        rtp: 94.7,
        volatility: "medium",
        minBet: 0.2,
        maxBet: 100
      },
      {
        title: "Hall of Gods",
        slug: "hall-of-gods",
        provider: "NetEnt",
        description: "Step into the realm of Norse gods and fight for jackpots.",
        image: "https://images.unsplash.com/photo-1639931785787-dbb9fb35ffe9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("jackpots")!,
        isFeatured: false,
        isPopular: false,
        isNew: false,
        isJackpot: true,
        jackpotAmount: 1245678.43,
        rtp: 95.3,
        volatility: "high",
        minBet: 0.2,
        maxBet: 50
      },
      {
        title: "Age of the Gods",
        slug: "age-of-the-gods",
        provider: "Playtech",
        description: "Greek mythology-themed slot with multiple progressive jackpots.",
        image: "https://images.unsplash.com/photo-1542089363-bcc089a2188c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("jackpots")!,
        isFeatured: false,
        isPopular: false,
        isNew: false,
        isJackpot: true,
        jackpotAmount: 876123.50,
        rtp: 95.0,
        volatility: "medium",
        minBet: 0.2,
        maxBet: 40
      },
      {
        title: "Jackpot Giant",
        slug: "jackpot-giant",
        provider: "Playtech",
        description: "Giant-sized fun and giant-sized jackpots.",
        image: "https://images.unsplash.com/photo-1560252829-804f1aedf1be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("jackpots")!,
        isFeatured: false,
        isPopular: false,
        isNew: false,
        isJackpot: true,
        jackpotAmount: 2453789.25,
        rtp: 94.2,
        volatility: "medium",
        minBet: 0.5,
        maxBet: 4
      },
      {
        title: "Book of Dead",
        slug: "book-of-dead",
        provider: "Play'n GO",
        description: "Join explorer Rich Wilde on his adventure through ancient Egypt.",
        image: "https://images.unsplash.com/photo-1596451190630-186aff535bf2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("popular")!,
        isFeatured: false,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 96.2,
        volatility: "high",
        minBet: 0.1,
        maxBet: 100
      },
      {
        title: "Starburst",
        slug: "starburst",
        provider: "NetEnt",
        description: "A dazzling jewel-themed slot with expanding wilds and respins.",
        image: "https://images.unsplash.com/photo-1606598896962-054141233e6a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("popular")!,
        isFeatured: false,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 96.1,
        volatility: "low",
        minBet: 0.1,
        maxBet: 100
      },
      {
        title: "Gates of Olympus",
        slug: "gates-of-olympus",
        provider: "Pragmatic Play",
        description: "Zeus himself grants huge multipliers in this godly slot.",
        image: "https://images.unsplash.com/photo-1652188594987-5c1ce68be7ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("popular")!,
        isFeatured: false,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 96.5,
        volatility: "high",
        minBet: 0.2,
        maxBet: 125
      },
      {
        title: "Reactoonz",
        slug: "reactoonz",
        provider: "Play'n GO",
        description: "Cute alien creatures create chain reactions of wins.",
        image: "https://images.unsplash.com/photo-1618172193763-c511deb635ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("popular")!,
        isFeatured: false,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 96.0,
        volatility: "high",
        minBet: 0.2,
        maxBet: 100
      },
      {
        title: "Big Bass Bonanza",
        slug: "big-bass-bonanza",
        provider: "Pragmatic Play",
        description: "Reel in the big one in this fishing-themed slot.",
        image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        categoryId: categoryMap.get("popular")!,
        isFeatured: false,
        isPopular: true,
        isNew: false,
        isJackpot: false,
        rtp: 96.7,
        volatility: "high",
        minBet: 0.1,
        maxBet: 250
      }
    ];

    // Check if games already exist
    const existingGamesCount = await db.query.games.findMany();
    if (existingGamesCount.length === 0) {
      console.log("Seeding games...");
      for (const game of games) {
        // Convert numeric values to strings for decimal fields as required by Drizzle
        await db.insert(schema.games).values({
          ...game,
          minBet: game.minBet.toString(),
          maxBet: game.maxBet.toString(),
          rtp: game.rtp.toString(),
          jackpotAmount: game.jackpotAmount ? game.jackpotAmount.toString() : undefined
        });
      }
    } else {
      console.log("Games already exist, skipping...");
    }

    // Seed test user for authentication
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      // Simple hash function to store password securely
      password: createHash('sha256').update('password123').digest('hex')
    };

    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.username, testUser.username)
    });

    if (!existingUser) {
      console.log("Seeding test user...");
      const [newUser] = await db.insert(schema.users).values(testUser).returning();
      console.log(`Created test user with ID: ${newUser.id}`);
      
      // Use the new user's ID for the balance
      const userId = newUser.id.toString();
      
      console.log("Seeding test user balance...");
      await db.insert(schema.userBalance).values({
        userId,
        balance: "1250.00"
      });
    } else {
      console.log("Test user already exists, skipping...");
      
      // Use existing user's ID for balance check
      const userId = existingUser.id.toString();
      
      // Check if balance exists for this user
      const existingBalance = await db.query.userBalance.findFirst({
        where: eq(schema.userBalance.userId, userId)
      });
      
      if (!existingBalance) {
        console.log("Seeding test user balance...");
        await db.insert(schema.userBalance).values({
          userId,
          balance: "1250.00"
        });
      } else {
        console.log("User balance already exists, skipping...");
      }
    }
    
    // Also maintain the guest user balance for backward compatibility
    const guestUserId = process.env.GUEST_USER_ID || 'guest-user';
    const existingGuestBalance = await db.query.userBalance.findFirst({
      where: eq(schema.userBalance.userId, guestUserId)
    });

    if (!existingGuestBalance) {
      console.log("Seeding guest user balance...");
      await db.insert(schema.userBalance).values({
        userId: guestUserId,
        balance: "1250.00"
      });
    } else {
      console.log("Guest user balance already exists, skipping...");
    }
    
    // Seed admin user
    const adminUser = {
      username: "admin",
      email: "admin@luckypunt.com",
      password: createHash('sha256').update('admin123').digest('hex'),
      role: "admin",
      isActive: true
    };
    
    // Check if admin user already exists
    const existingAdmin = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.username, adminUser.username)
    });
    
    if (!existingAdmin) {
      console.log("Seeding admin user...");
      const [newAdmin] = await db.insert(schema.adminUsers).values(adminUser).returning();
      console.log(`Created admin user with ID: ${newAdmin.id}`);
    } else {
      console.log("Admin user already exists, skipping...");
    }
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
