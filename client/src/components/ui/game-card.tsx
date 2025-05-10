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
      <div className="relative overflow-hidden transition-all duration-300 hover:opacity-90">
        <img 
          src={image} 
          alt={title} 
          className="w-full aspect-square object-cover"
        />
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity flex items-center justify-center",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Link href={`/game/${id}`}>
            <button className="bg-secondary hover:bg-secondary-light transition-colors text-gray-900 font-bold py-2 px-6 rounded">
              PLAY
            </button>
          </Link>
        </div>
        
        {tag && (
          <div className={`absolute top-2 right-2 ${tagBgColors[tag.type]} bg-opacity-90 text-white text-xs px-2 py-1 rounded-sm`}>
            {tag.text}
          </div>
        )}
        
        {jackpotAmount && (
          <div className="absolute bottom-0 left-0 right-0 bg-primary-dark bg-opacity-90 text-white text-center py-1">
            <span className="text-sm font-bold">${jackpotAmount.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
