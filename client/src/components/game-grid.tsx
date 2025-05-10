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
];

interface GameGridProps {
  title: string;
  filter?: string;
  viewAllLink?: string;
  limit?: number;
}

export function GameGrid({ title, filter = 'all', viewAllLink, limit = 10 }: GameGridProps) {
  // Select games to display based on filter (using placeholders)
  const gamesForDisplay = PLACEHOLDER_GAMES.slice(0, limit);
  
  return (
    <section className="bg-dark py-1">
      <div className="container mx-auto px-2">
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
              provider={game.provider}
              image={game.image}
              tag={game.tag}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
