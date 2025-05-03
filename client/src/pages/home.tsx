import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';
import { HeroBanner } from '@/components/hero-banner';
import { CategoryFilter, Category } from '@/components/category-filter';
import { GameGrid } from '@/components/game-grid';
import { SlotMachine } from '@/components/ui/slot-machine';
import { CallToAction } from '@/components/call-to-action';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroBanner />
        
        <CategoryFilter 
          categories={categories || defaultCategories} 
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
        
        <GameGrid 
          title="Featured Games" 
          filter="featured" 
          viewAllLink="/games/featured" 
        />
        
        <section className="bg-dark-light py-10" id="try-your-luck">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-3xl mb-2">Try Your Luck</h2>
              <p className="text-gray-400">Spin the reels and win big!</p>
            </div>
            
            <SlotMachine />
          </div>
        </section>
        
        <GameGrid 
          title="Jackpot Games" 
          filter="jackpot" 
          viewAllLink="/games/jackpot" 
        />
        
        <GameGrid 
          title="Popular Games" 
          filter="popular" 
          viewAllLink="/games/popular" 
        />
        
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}

// Fallback categories in case API fails
const defaultCategories: Category[] = [
  { id: 'all', name: 'All Slots' },
  { id: 'new', name: 'New Games' },
  { id: 'popular', name: 'Popular' },
  { id: 'jackpot', name: 'Jackpots' },
  { id: 'megaways', name: 'Megaways' },
  { id: 'classic', name: 'Classic Slots' },
  { id: 'bonus', name: 'Bonus Buy' },
  { id: 'fruit', name: 'Fruit Slots' },
];
