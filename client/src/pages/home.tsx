import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { CategoryFilter, Category } from '@/components/category-filter';
import { GameGrid } from '@/components/game-grid';
import { SlotMachine } from '@/components/ui/slot-machine';
import { CallToAction } from '@/components/call-to-action';

export default function Home() {
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pageTitle, setPageTitle] = useState('Featured Games');
  const [currentFilter, setCurrentFilter] = useState('featured');
  
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Set page title and filter based on the current route
  useEffect(() => {
    if (location === '/') {
      setPageTitle('Featured Games');
      setCurrentFilter('featured');
    } else if (location === '/jackpots') {
      setPageTitle('Jackpot Games');
      setCurrentFilter('jackpot');
    } else if (location === '/popular') {
      setPageTitle('Popular Games');
      setCurrentFilter('popular');
    } else if (location === '/new-games') {
      setPageTitle('New Releases');
      setCurrentFilter('new');
    } else if (location === '/featured') {
      setPageTitle('Featured Games');
      setCurrentFilter('featured');
    } else if (location === '/premium') {
      setPageTitle('Premium Games');
      setCurrentFilter('premium');
    } else if (location.startsWith('/category/')) {
      const slug = location.split('/').pop();
      setPageTitle(`${slug?.replace(/-/g, ' ')} Games`);
      setCurrentFilter('all');
      setSelectedCategory(slug || 'all');
    }
  }, [location]);
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  return (
    <div className="container mx-auto px-4 pt-2">
      {/* Category Filter Bar */}
      <div className="mb-6">
        <CategoryFilter 
          categories={categories || defaultCategories} 
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
      </div>
      
      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading font-bold text-3xl text-white">
          {pageTitle}
        </h1>
      </div>
      
      {/* Main Content */}
      <div className="space-y-12">
        {/* Games Grid */}
        <GameGrid 
          title="" 
          filter={currentFilter} 
          limit={12}
        />
        
        {/* Featured Slot Machine (only on home page) */}
        {location === '/' && (
          <section className="bg-dark-light py-10 rounded-xl neon-border overflow-hidden" id="try-your-luck">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="font-heading font-bold text-3xl mb-2 text-white animate-neon-glow">Try Your Luck</h2>
                <p className="text-muted-foreground">Spin the reels and win big!</p>
              </div>
              
              <SlotMachine />
            </div>
          </section>
        )}
        
        {/* Call to Action (only on home page) */}
        {location === '/' && (
          <CallToAction />
        )}
      </div>
    </div>
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
