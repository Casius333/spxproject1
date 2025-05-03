import { useState } from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface GameCardProps {
  id: number;
  title: string;
  provider: string;
  image: string;
  tag?: {
    text: string;
    type: 'hot' | 'new' | 'popular' | 'jackpot';
  };
  jackpotAmount?: number;
  className?: string;
}

export function GameCard({ 
  id, 
  title, 
  provider, 
  image, 
  tag, 
  jackpotAmount, 
  className 
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Tag background colors
  const tagBgColors = {
    hot: 'bg-primary-dark',
    new: 'bg-primary-dark',
    popular: 'bg-primary-dark',
    jackpot: 'bg-green-600'
  };
  
  return (
    <div 
      className={cn("game-card group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-lg overflow-hidden bg-dark-card border border-gray-800 transition-all duration-300 hover:border-secondary">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-40 object-cover"
        />
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-dark to-transparent transition-opacity flex items-end justify-center pb-10",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Link href={`/game/${id}`}>
            <button className="bg-secondary hover:bg-secondary-light transition-colors text-gray-900 font-bold py-2 px-4 rounded-lg">
              Play Now
            </button>
          </Link>
        </div>
        
        {tag && (
          <div className={`absolute top-2 right-2 ${tagBgColors[tag.type]} bg-opacity-80 text-white text-xs px-2 py-1 rounded`}>
            {tag.text}
          </div>
        )}
        
        {jackpotAmount && (
          <div className="absolute bottom-0 left-0 right-0 bg-primary-dark bg-opacity-90 text-white text-center py-1">
            <span className="text-sm font-bold">${jackpotAmount.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-center">
        <h3 className="font-medium">{title}</h3>
        <p className="text-xs text-gray-400">{provider}</p>
      </div>
    </div>
  );
}
