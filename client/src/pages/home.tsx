import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { CategoryFilter, Category } from '@/components/category-filter';
import { GameGrid } from '@/components/game-grid';
import { CallToAction } from '@/components/call-to-action';
import { CarouselBanner } from '@/components/ui/carousel-banner';
import { PromotionBanner } from '@/components/ui/promotion-banner';

export default function Home() {
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pageTitle, setPageTitle] = useState('Games');
  
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Set page title based on the current route
  useEffect(() => {
    if (location === '/') {
      setPageTitle('Games');
    } else if (location === '/jackpots') {
      setPageTitle('Jackpot Games');
    } else if (location === '/popular') {
      setPageTitle('Popular Games');
    } else if (location === '/new-games') {
      setPageTitle('New Releases');
    } else if (location === '/premium') {
      setPageTitle('Premium Games');
    } else if (location.startsWith('/category/')) {
      const slug = location.split('/').pop();
      setPageTitle(`${slug?.replace(/-/g, ' ')} Games`);
      setSelectedCategory(slug || 'all');
    }
  }, [location]);
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  return (
    <div className="mx-auto">
      {/* Home page layout with banner and promotion */}
      {location === '/' && (
        <div className="mb-8">
          {/* Carousel Banner */}
          <div className="w-full mb-4">
            <CarouselBanner />
          </div>
          
          {/* Promotion Banner */}
          <div className="container mx-auto px-4">
            <PromotionBanner 
              title="Deposit Bonus"
              description="Get 100% bonus on your next deposit!"
              actionText="View Promotions"
              onClick={() => console.log('Navigate to promotions')}
            />
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4">
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
          {/* Games Grid - No Title */}
          <GameGrid 
            title="" 
            limit={12}
          />
          
          {/* Call to Action (only on home page) */}
          {location === '/' && (
            <CallToAction />
          )}
        </div>
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
