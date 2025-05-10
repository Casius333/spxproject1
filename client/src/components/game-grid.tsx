import { GameCard } from '@/components/ui/game-card';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

// Define placeholder games with generic data
const PLACEHOLDER_GAMES = [
  {
    id: 1,
    title: 'Fortune Spinner',
    provider: 'Lucky Games',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+1',
    tag: { text: 'New', type: 'new' as const },
  },
  {
    id: 2,
    title: 'Golden Treasures',
    provider: 'Spin Masters',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+2',
    tag: { text: 'Popular', type: 'popular' as const },
  },
  {
    id: 3,
    title: 'Wild Jackpot',
    provider: 'Casino Kings',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+3',
    tag: { text: 'Jackpot', type: 'jackpot' as const },
  },
  {
    id: 4,
    title: 'Lucky Sevens',
    provider: 'Vegas Slots',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+4',
  },
  {
    id: 5,
    title: 'Diamond Deluxe',
    provider: 'Premium Games',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+5',
    tag: { text: 'Hot', type: 'hot' as const },
  },
  {
    id: 6,
    title: 'Mystic Fortunes',
    provider: 'Galaxy Gaming',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+6',
  },
  {
    id: 7,
    title: 'Royal Flush',
    provider: 'Casino Masters',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+7',
    tag: { text: 'New', type: 'new' as const },
  },
  {
    id: 8,
    title: 'Gems & Jewels',
    provider: 'Supreme Slots',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+8',
  },
  {
    id: 9,
    title: 'Mega Millions',
    provider: 'Fortune Games',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+9',
    tag: { text: 'Jackpot', type: 'jackpot' as const },
  },
  {
    id: 10,
    title: 'Classic Slots',
    provider: 'Retro Gaming',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+10',
  },
  {
    id: 11,
    title: 'Treasure Hunt',
    provider: 'Adventure Games',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+11',
    tag: { text: 'Popular', type: 'popular' as const },
  },
  {
    id: 12,
    title: 'Fruit Frenzy',
    provider: 'Classic Gaming',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+12',
  },
  {
    id: 13,
    title: "Dragon's Lair",
    provider: 'Fantasy Slots',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+13',
    tag: { text: 'Hot', type: 'hot' as const },
  },
  {
    id: 14,
    title: 'Gold Rush',
    provider: 'Western Gaming',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+14',
  },
  {
    id: 15,
    title: 'Mega Joker',
    provider: 'Casino Plus',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+15',
    tag: { text: 'Jackpot', type: 'jackpot' as const },
  },
  {
    id: 16,
    title: 'Egyptian Riches',
    provider: 'Ancient Slots',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+16',
  },
  {
    id: 17,
    title: 'Neon Nights',
    provider: 'Modern Games',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+17',
    tag: { text: 'New', type: 'new' as const },
  },
  {
    id: 18,
    title: 'Space Invaders',
    provider: 'Retro Gaming',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+18',
  },
  {
    id: 19,
    title: "Pirate's Bounty",
    provider: 'Adventure Games',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+19',
  },
  {
    id: 20,
    title: 'Crystal Kingdom',
    provider: 'Fantasy Slots',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+20',
    tag: { text: 'Popular', type: 'popular' as const },
  },
  {
    id: 21,
    title: 'Super Bonus',
    provider: 'Jackpot Kings',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+21',
    tag: { text: 'Jackpot', type: 'jackpot' as const },
  },
  {
    id: 22,
    title: 'Vegas Dreams',
    provider: 'Casino Royale',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+22',
  },
  {
    id: 23,
    title: 'Mystic Gems',
    provider: 'Magic Slots',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+23',
    tag: { text: 'New', type: 'new' as const },
  },
  {
    id: 24,
    title: 'Wild West',
    provider: 'Western Gaming',
    image: 'https://placehold.co/400x400/1a1c24/444?text=Game+24',
  },
];

interface GameGridProps {
  title: string;
  filter?: string;
  searchQuery?: string;
  providerId?: number | null;
  viewAllLink?: string;
  limit?: number;
}

export function GameGrid({ title, filter = 'all', searchQuery = '', providerId = null, viewAllLink, limit = 10 }: GameGridProps) {
  // Filter games based on the parameters
  let filteredGames = [...PLACEHOLDER_GAMES];
  
  // Apply filter based on category
  if (filter === 'search' && searchQuery) {
    // Search by name or provider
    filteredGames = filteredGames.filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } else if (filter !== 'all' && filter !== 'search' && filter !== 'provider') {
    // Filter by category
    // For our placeholder implementation, we're just filtering games by position in the array
    // In a real implementation, this would filter by category
    const categoryIndex = parseInt(filter) % 3;
    filteredGames = filteredGames.filter((_, index) => index % 3 === categoryIndex);
  }
  
  // Apply provider filter if specified
  if (filter === 'provider' && providerId) {
    // Filter by provider ID
    // In this placeholder implementation, we'll just filter games by index
    const providerMod = providerId % 5;
    filteredGames = filteredGames.filter((_, index) => index % 5 === providerMod);
  }
  
  // Apply limit
  const gamesForDisplay = filteredGames.slice(0, limit);
  
  return (
    <section className="bg-dark py-2">
      <div className="container mx-auto px-4">
        {title && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-2xl">{title}</h2>
            {viewAllLink && (
              <Link href={viewAllLink} className="text-secondary hover:text-secondary-light transition-colors flex items-center">
                View all <ChevronRight className="ml-1" size={16} />
              </Link>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
          {gamesForDisplay.map(game => (
            <GameCard 
              key={game.id}
              id={game.id}
              title={game.title}
              provider={game.provider || ''}
              image={game.image}
              tag={game.tag}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
