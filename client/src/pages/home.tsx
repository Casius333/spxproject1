import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { CategoryFilter, Category, Provider } from '@/components/category-filter';
import { GameGrid } from '@/components/game-grid';
import { CarouselBanner } from '@/components/ui/carousel-banner';
import { PromotionBanner } from '@/components/ui/promotion-banner';
import { RecentWins } from '@/components/win-notification';

export default function Home() {
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    // Reset search and provider filters when changing category
    setSearchQuery('');
  };
  
  const handleProviderSelect = (providerId: number) => {
    setSelectedProvider(providerId);
    // Reset search when changing provider
    setSearchQuery('');
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset filters when searching
    setSelectedCategory('all');
    setSelectedProvider(null);
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
        <div className="mb-1">
          <CategoryFilter 
            categories={categories || defaultCategories} 
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            onSearch={handleSearch}
            onSelectProvider={handleProviderSelect}
          />
        </div>
        
        {/* Main Content */}
        <div className="space-y-1">
          {/* Games Grid - No Title */}
          {searchQuery ? (
            <GameGrid 
              title={`Search Results for "${searchQuery}"`}
              filter="search"
              searchQuery={searchQuery}
              limit={24}
            />
          ) : selectedProvider ? (
            <GameGrid 
              title=""
              filter="provider"
              providerId={selectedProvider}
              limit={24}
            />
          ) : (
            <GameGrid 
              title=""
              filter={selectedCategory} 
              limit={24}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Fallback categories in case API fails
const defaultCategories: Category[] = [
  { id: '1', name: 'All Slots' },
  { id: '2', name: 'New Games' },
  { id: '3', name: 'Popular' },
  { id: '4', name: 'Live Games' },
  { id: '5', name: 'Table Games' },
  { id: '6', name: 'Bonus Buy' },
  { id: '7', name: 'Classic Slots' },
];
