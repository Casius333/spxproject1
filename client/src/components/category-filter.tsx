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
        {/* Categories row */}
        <div className="flex overflow-x-auto pb-1 scrollbar-hide space-x-4">
          {categories.map((category) => (
            <button
              key={category.id}
              className={cn(
                "whitespace-nowrap px-5 py-2.5 rounded-full font-medium transition-colors",
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
        
        {/* Providers dropdown and search row */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Providers dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProvidersOpen(!isProvidersOpen)}
              className="flex items-center justify-between bg-dark-card text-white px-5 py-2.5 rounded-md w-40 md:w-48"
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
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-card text-white px-5 py-2.5 pl-10 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary-light text-white px-2 py-1 rounded-sm text-xs"
              >
                Go
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
