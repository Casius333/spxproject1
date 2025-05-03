import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';
import { SlotMachine } from '@/components/ui/slot-machine';
import { GameGrid } from '@/components/game-grid';
import { ChevronLeft } from 'lucide-react';

export default function Game() {
  const [match, params] = useRoute('/game/:id');
  const gameId = params?.id;
  
  const { data: game, isLoading, error } = useQuery({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });
  
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-dark py-8">
          <div className="container mx-auto px-4">
            <div className="animate-pulse bg-dark-card rounded-xl p-8">
              <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  if (error || !game) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-dark py-8">
          <div className="container mx-auto px-4">
            <div className="bg-dark-card p-8 rounded-xl">
              <h1 className="text-2xl font-heading font-bold mb-4">Game Not Found</h1>
              <p className="text-gray-400 mb-6">Sorry, we couldn't find the game you're looking for.</p>
              <Link href="/">
                <button className="bg-primary hover:bg-primary-light transition-colors px-4 py-2 rounded-lg font-medium">
                  Return Home
                </button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Header />
      <main className="flex-1 bg-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/">
              <button className="flex items-center text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={20} />
                <span>Back to Games</span>
              </button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-heading font-bold mb-2">{game.title}</h1>
          <p className="text-gray-400 mb-6">by {game.provider}</p>
          
          <div className="mb-12">
            <SlotMachine />
          </div>
          
          <GameGrid 
            title="You Might Also Like" 
            filter="popular"
            limit={5}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
