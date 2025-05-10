import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="bg-dark py-2">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-4">
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
      </div>
    </div>
  );
}
