import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export interface Category {
  id: string;
  name: string;
}

export interface Provider {
  id: number;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onSearch?: (query: string) => void;
  onSelectProvider?: (providerId: number) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory, onSearch, onSelectProvider }: CategoryFilterProps) {
  const [isProvidersOpen, setIsProvidersOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch providers
  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ['/api/providers'],
    queryFn: async () => {
      const res = await fetch('/api/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      return res.json();
    }
  });

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsProvidersOpen(false);
    
    // Pass provider ID to parent component for filtering
    if (onSelectProvider) {
      onSelectProvider(provider.id);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim().length > 0) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="bg-dark py-1">
      <div className="container mx-auto px-4">
        {/* All filters in one row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Category buttons */}
          <div className="flex-none flex">
            {categories.map((category) => (
              <button
                key={category.id}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-md font-medium transition-colors mr-2",
                  category.id === selectedCategory
                    ? "bg-primary hover:bg-primary-light text-white"
                    : "bg-dark-card hover:bg-dark-light text-white"
                )}
                onClick={() => onSelectCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* Providers dropdown */}
          <div className="flex-none relative">
            <button 
              onClick={() => setIsProvidersOpen(!isProvidersOpen)}
              className="flex items-center justify-between bg-dark-card text-white px-4 py-2 rounded-md w-32"
            >
              <span className="truncate">
                {selectedProvider ? selectedProvider.name : 'Providers'}
              </span>
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {isProvidersOpen && (
              <div className="absolute z-10 mt-1 w-full bg-dark-card rounded-md shadow-lg max-h-60 overflow-auto">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    className="w-full px-4 py-2 text-left text-white hover:bg-dark-light"
                    onClick={() => handleProviderSelect(provider)}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex-1 max-w-[300px]">
            <div className="relative w-full overflow-visible">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-card text-white px-4 py-2 pr-10 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Search className="h-5 w-5 text-white" />
              </div>
              <button 
                type="submit"
                className="sr-only"
                aria-label="Search"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
