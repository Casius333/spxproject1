import { Request, Response } from "express";

// Placeholder categories
const CATEGORIES = [
  { id: 1, name: 'All Slots', slug: 'all-slots', description: 'All slot games available' },
  { id: 2, name: 'New Games', slug: 'new', description: 'Latest releases' },
  { id: 3, name: 'Popular', slug: 'popular', description: 'Most played games' },
  { id: 4, name: 'Live Games', slug: 'live', description: 'Live dealer games' },
  { id: 5, name: 'Megaways', slug: 'megaways', description: 'Games with Megaways mechanic' },
  { id: 6, name: 'Table Games', slug: 'table', description: 'Casino table games' },
  { id: 7, name: 'Bonus Buy', slug: 'bonus', description: 'Games with bonus buy feature' },
  { id: 8, name: 'Classic Slots', slug: 'classic', description: 'Traditional slot games' },
];

// Placeholder providers
const PROVIDERS = [
  { id: 1, name: 'All Providers', slug: 'all' },
  { id: 2, name: 'Lucky Games', slug: 'lucky-games' },
  { id: 3, name: 'Spin Masters', slug: 'spin-masters' },
  { id: 4, name: 'Casino Kings', slug: 'casino-kings' },
  { id: 5, name: 'Vegas Slots', slug: 'vegas-slots' },
  { id: 6, name: 'Premium Games', slug: 'premium-games' },
  { id: 7, name: 'Galaxy Gaming', slug: 'galaxy-gaming' },
  { id: 8, name: 'Casino Masters', slug: 'casino-masters' },
  { id: 9, name: 'Supreme Slots', slug: 'supreme-slots' },
  { id: 10, name: 'Fortune Games', slug: 'fortune-games' },
  { id: 11, name: 'Retro Gaming', slug: 'retro-gaming' },
  { id: 12, name: 'Adventure Games', slug: 'adventure-games' },
];

// Placeholder games with generic placeholders
const PLACEHOLDER_GAMES = [
  {
    id: 1,
    title: 'Fortune Spinner',
    provider: 'Lucky Games',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+1',
    category: 'all-slots',
    isFeatured: true,
    isPopular: false,
    isJackpot: false,
    isNew: true,
  },
  {
    id: 2,
    title: 'Golden Treasures',
    provider: 'Spin Masters',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+2',
    category: 'popular',
    isFeatured: true,
    isPopular: true,
    isJackpot: false,
    isNew: false,
  },
  {
    id: 3,
    title: 'Wild Jackpot',
    provider: 'Casino Kings',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+3',
    category: 'jackpot',
    isFeatured: true,
    isPopular: false,
    isJackpot: true,
    isNew: false,
    jackpotAmount: 387500
  },
  {
    id: 4,
    title: 'Lucky Sevens',
    provider: 'Vegas Slots',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+4',
    category: 'classic',
    isFeatured: false,
    isPopular: false,
    isJackpot: false,
    isNew: false,
  },
  {
    id: 5,
    title: 'Diamond Deluxe',
    provider: 'Premium Games',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+5',
    category: 'all-slots',
    isFeatured: true,
    isPopular: true,
    isJackpot: false,
    isNew: false,
  },
  {
    id: 6,
    title: 'Mystic Fortunes',
    provider: 'Galaxy Gaming',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+6',
    category: 'all-slots',
    isFeatured: false,
    isPopular: false,
    isJackpot: false,
    isNew: false,
  },
  {
    id: 7,
    title: 'Royal Flush',
    provider: 'Casino Masters',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+7',
    category: 'new',
    isFeatured: false,
    isPopular: false,
    isJackpot: false,
    isNew: true,
  },
  {
    id: 8,
    title: 'Gems & Jewels',
    provider: 'Supreme Slots',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+8',
    category: 'all-slots',
    isFeatured: false,
    isPopular: false,
    isJackpot: false,
    isNew: false,
  },
  {
    id: 9,
    title: 'Mega Millions',
    provider: 'Fortune Games',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+9',
    category: 'jackpot',
    isFeatured: false,
    isPopular: false,
    isJackpot: true,
    isNew: false,
    jackpotAmount: 1245750
  },
  {
    id: 10,
    title: 'Classic Slots',
    provider: 'Retro Gaming',
    image: 'https://placehold.co/300x200/1e293b/e2e8f0?text=Game+10',
    category: 'classic',
    isFeatured: false,
    isPopular: false,
    isJackpot: false,
    isNew: false,
  },
];

export const gamesController = {
  // Get all providers
  getAllProviders: async (_req: Request, res: Response) => {
    try {
      return res.status(200).json(PROVIDERS);
    } catch (error) {
      console.error("Error fetching providers:", error);
      return res.status(500).json({ message: "Failed to fetch providers" });
    }
  },

  // Get games by provider
  getGamesByProvider: async (req: Request, res: Response) => {
    try {
      const providerId = parseInt(req.params.providerId);
      
      if (isNaN(providerId)) {
        return res.status(400).json({ message: "Invalid provider ID" });
      }
      
      const provider = PROVIDERS.find(p => p.id === providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      // If "All Providers" is selected, return all games
      if (provider.slug === 'all') {
        return res.status(200).json(PLACEHOLDER_GAMES);
      }
      
      const games = PLACEHOLDER_GAMES.filter(g => 
        provider.name === g.provider || 
        provider.slug === g.provider.toLowerCase().replace(/\s+/g, '-')
      );
      return res.status(200).json(games);
    } catch (error) {
      console.error("Error fetching games by provider:", error);
      return res.status(500).json({ message: "Failed to fetch games by provider" });
    }
  },

  // Get all games
  getAllGames: async (_req: Request, res: Response) => {
    try {
      return res.status(200).json(PLACEHOLDER_GAMES);
    } catch (error) {
      console.error("Error fetching games:", error);
      return res.status(500).json({ message: "Failed to fetch games" });
    }
  },

  // Get game by ID
  getGameById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = PLACEHOLDER_GAMES.find(g => g.id === id);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      return res.status(200).json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      return res.status(500).json({ message: "Failed to fetch game" });
    }
  },

  // Get games by category
  getGamesByCategory: async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = CATEGORIES.find(c => c.id === categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const games = PLACEHOLDER_GAMES.filter(g => g.category === category.slug);
      return res.status(200).json(games);
    } catch (error) {
      console.error("Error fetching games by category:", error);
      return res.status(500).json({ message: "Failed to fetch games by category" });
    }
  },

  // Get all categories
  getAllCategories: async (_req: Request, res: Response) => {
    try {
      return res.status(200).json(CATEGORIES);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ message: "Failed to fetch categories" });
    }
  },

  // Get featured games
  getFeaturedGames: async (_req: Request, res: Response) => {
    try {
      const featuredGames = PLACEHOLDER_GAMES.filter(g => g.isFeatured);
      return res.status(200).json(featuredGames);
    } catch (error) {
      console.error("Error fetching featured games:", error);
      return res.status(500).json({ message: "Failed to fetch featured games" });
    }
  },

  // Get jackpot games
  getJackpotGames: async (_req: Request, res: Response) => {
    try {
      const jackpotGames = PLACEHOLDER_GAMES.filter(g => g.isJackpot);
      return res.status(200).json(jackpotGames);
    } catch (error) {
      console.error("Error fetching jackpot games:", error);
      return res.status(500).json({ message: "Failed to fetch jackpot games" });
    }
  },

  // Get popular games
  getPopularGames: async (_req: Request, res: Response) => {
    try {
      const popularGames = PLACEHOLDER_GAMES.filter(g => g.isPopular);
      return res.status(200).json(popularGames);
    } catch (error) {
      console.error("Error fetching popular games:", error);
      return res.status(500).json({ message: "Failed to fetch popular games" });
    }
  },

  // Get new games
  getNewGames: async (_req: Request, res: Response) => {
    try {
      const newGames = PLACEHOLDER_GAMES.filter(g => g.isNew);
      return res.status(200).json(newGames);
    } catch (error) {
      console.error("Error fetching new games:", error);
      return res.status(500).json({ message: "Failed to fetch new games" });
    }
  },

  // Search games
  searchGames: async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const results = PLACEHOLDER_GAMES.filter(game => 
        game.title.toLowerCase().includes(query.toLowerCase()) || 
        game.provider.toLowerCase().includes(query.toLowerCase())
      );
      
      return res.status(200).json(results);
    } catch (error) {
      console.error("Error searching games:", error);
      return res.status(500).json({ message: "Failed to search games" });
    }
  }
};
