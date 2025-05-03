import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WinNotificationProps {
  winAmount: number;
  isVisible: boolean;
  onCollect: () => void;
}

export function WinNotification({ winAmount, isVisible, onCollect }: WinNotificationProps) {
  const [animateIn, setAnimateIn] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      // Delay the animation slightly for better effect
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isVisible]);
  
  return (
    <div 
      className={cn(
        "fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="bg-black bg-opacity-50 absolute inset-0"></div>
      <div 
        className={cn(
          "relative bg-dark-card border-2 border-secondary rounded-xl p-6 max-w-sm w-full mx-4 text-center transform transition-all duration-300",
          animateIn ? "scale-100 opacity-100" : "scale-90 opacity-0",
          isVisible ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <Trophy className="text-4xl text-secondary" size={40} />
        </div>
        <h3 className="font-heading font-bold text-2xl mt-4 mb-2">YOU WON!</h3>
        <p className="text-3xl text-secondary font-bold mb-4">{formatCurrency(winAmount)}</p>
        <Button 
          onClick={onCollect}
          className="bg-secondary hover:bg-secondary-light text-gray-900 font-bold py-2 px-6 rounded-lg"
        >
          Collect
        </Button>
      </div>
    </div>
  );
}
