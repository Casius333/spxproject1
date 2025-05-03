import { Request, Response } from "express";
import * as storage from "../storage";

export const gamesController = {
  // Get all games
  getAllGames: async (req: Request, res: Response) => {
    try {
      const games = await storage.getAllGames();
      return res.status(200).json(games);
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
      
      const game = await storage.getGameById(id);
      
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
      
      const games = await storage.getGamesByCategory(categoryId);
      return res.status(200).json(games);
    } catch (error) {
      console.error("Error fetching games by category:", error);
      return res.status(500).json({ message: "Failed to fetch games by category" });
    }
  },

  // Get all categories
  getAllCategories: async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      return res.status(200).json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ message: "Failed to fetch categories" });
    }
  },

  // Get featured games
  getFeaturedGames: async (req: Request, res: Response) => {
    try {
      const featuredGames = await storage.getFeaturedGames();
      return res.status(200).json(featuredGames);
    } catch (error) {
      console.error("Error fetching featured games:", error);
      return res.status(500).json({ message: "Failed to fetch featured games" });
    }
  },

  // Get jackpot games
  getJackpotGames: async (req: Request, res: Response) => {
    try {
      const jackpotGames = await storage.getJackpotGames();
      return res.status(200).json(jackpotGames);
    } catch (error) {
      console.error("Error fetching jackpot games:", error);
      return res.status(500).json({ message: "Failed to fetch jackpot games" });
    }
  },

  // Get popular games
  getPopularGames: async (req: Request, res: Response) => {
    try {
      const popularGames = await storage.getPopularGames();
      return res.status(200).json(popularGames);
    } catch (error) {
      console.error("Error fetching popular games:", error);
      return res.status(500).json({ message: "Failed to fetch popular games" });
    }
  },

  // Get new games
  getNewGames: async (req: Request, res: Response) => {
    try {
      const newGames = await storage.getNewGames();
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
      
      const results = await storage.searchGames(query);
      return res.status(200).json(results);
    } catch (error) {
      console.error("Error searching games:", error);
      return res.status(500).json({ message: "Failed to search games" });
    }
  }
};
