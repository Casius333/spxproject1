import { useQuery } from '@tanstack/react-query';
import { GameCard } from '@/components/ui/game-card';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

interface Game {
  id: number;
  title: string;
  provider: string;
  image: string;
  category: string;
  isFeatured: boolean;
  isPopular: boolean;
  isJackpot: boolean;
  isNew: boolean;
  jackpotAmount?: number;
}

interface GameGridProps {
  title: string;
  filter?: string;
  viewAllLink?: string;
  limit?: number;
}

export function GameGrid({ title, filter = 'all', viewAllLink, limit = 5 }: GameGridProps) {
  const { data: games, isLoading, error } = useQuery<Game[]>({
    queryKey: ['/api/games', filter],
  });
  
  // Filter games based on the provided filter
  const filteredGames = games
    ? games.filter(game => {
        if (filter === 'all') return game.isFeatured;
        if (filter === 'jackpot') return game.isJackpot;
        if (filter === 'popular') return game.isPopular;
        if (filter === 'new') return game.isNew;
        if (filter === 'featured') return game.isFeatured;
        return game.category === filter;
      }).slice(0, limit)
    : [];
  
  if (isLoading) {
    return (
      <section className="bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-2xl">{title}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden bg-dark-card border border-gray-800 h-64 animate-pulse">
                <div className="w-full h-40 bg-gray-800"></div>
                <div className="p-2">
                  <div className="w-3/4 h-4 bg-gray-800 rounded mb-2 mx-auto"></div>
                  <div className="w-1/2 h-3 bg-gray-800 rounded mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  if (error || !games) {
    return (
      <section className="bg-dark py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-bold text-2xl">{title}</h2>
          </div>
          <div className="bg-dark-card p-4 rounded-lg text-center text-gray-400">
            <p>Error loading games. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="bg-dark py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading font-bold text-2xl">{title}</h2>
          {viewAllLink && (
            <Link href={viewAllLink} className="text-secondary hover:text-secondary-light transition-colors flex items-center">
              View all <ChevronRight className="ml-1" size={16} />
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredGames.map(game => (
            <GameCard 
              key={game.id}
              id={game.id}
              title={game.title}
              provider={game.provider}
              image={game.image}
              tag={
                game.isNew ? { text: 'New', type: 'new' } :
                game.isJackpot ? { text: game.jackpotAmount ? 'Mega Jackpot' : 'Jackpot', type: 'jackpot' } :
                game.isPopular ? { text: 'Popular', type: 'popular' } :
                game.isFeatured ? { text: 'Hot', type: 'hot' } :
                undefined
              }
              jackpotAmount={game.isJackpot ? game.jackpotAmount : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
