import { useEffect, useState } from 'react';
import { Trophy, PartyPopper, Coins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSlotMachine } from '@/hooks/use-slot-machine';

interface WinNotificationProps {
  winAmount: number;
  isVisible: boolean;
  onCollect: () => void;
}

// Function to generate random position for confetti particles
const getRandomPosition = () => {
  return {
    top: Math.random() * 100 + '%',
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 2 + 's',
  };
};

export function WinNotification({ winAmount, isVisible, onCollect }: WinNotificationProps) {
  const [animateIn, setAnimateIn] = useState(false);
  const [confetti, setConfetti] = useState<{ top: string; left: string; animationDelay: string }[]>([]);
  const { betAmount } = useSlotMachine();
  
  useEffect(() => {
    if (isVisible) {
      // Generate confetti particles
      const newConfetti = Array.from({ length: 30 }, () => getRandomPosition());
      setConfetti(newConfetti);
      
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
      {/* Backdrop blur */}
      <div className="bg-black/70 backdrop-blur-md absolute inset-0"></div>
      
      {/* Confetti animation */}
      {isVisible && confetti.map((particle, index) => (
        <div
          key={index}
          className="absolute w-3 h-3 rounded-full animate-fall"
          style={{
            top: particle.top,
            left: particle.left,
            animationDelay: particle.animationDelay,
            backgroundColor: index % 3 === 0 ? 'hsl(var(--primary))' : 
                            index % 3 === 1 ? 'hsl(var(--secondary))' : 
                            'hsl(var(--accent))',
          }}
        />
      ))}
      
      {/* Win popup */}
      <div 
        className={cn(
          "relative glass-effect border-2 border-secondary/60 neon-border rounded-xl p-8 max-w-md w-full mx-4 text-center transform transition-all duration-500",
          animateIn ? "scale-100 opacity-100 animate-win-celebration" : "scale-90 opacity-0",
          isVisible ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Trophy icon */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary rounded-full blur-xl opacity-40 animate-pulse-fast"></div>
            <Trophy className="text-5xl text-secondary animate-neon-glow" size={60} />
          </div>
        </div>
        
        {/* Win message */}
        <div className="mt-8 mb-4">
          <h3 className="font-heading font-bold text-3xl text-white mb-2 animate-neon-glow">BIG WIN!</h3>
          <div className="flex justify-center items-center gap-3">
            <PartyPopper className="text-secondary w-6 h-6" />
            <p className="text-4xl text-secondary font-bold animate-jackpot-flash">{formatCurrency(winAmount)}</p>
            <PartyPopper className="text-secondary w-6 h-6" />
          </div>
        </div>
        
        {/* Multiplier badge (for bigger wins) */}
        {winAmount > 0 && betAmount > 0 && winAmount > betAmount * 5 && (
          <div className="mb-4">
            <div className="inline-block px-4 py-1 bg-primary/20 rounded-full">
              <span className="text-sm font-bold text-primary">
                {Math.round(winAmount / betAmount)}X MULTIPLIER
              </span>
            </div>
          </div>
        )}
        
        {/* Collect button */}
        <Button 
          onClick={onCollect}
          className="bg-gradient-to-r from-secondary-dark to-secondary hover:from-secondary hover:to-secondary-light text-dark font-bold py-3 px-10 rounded-full transition-all duration-300 text-lg mt-2 shadow-lg hover:shadow-secondary/30 animate-neon-glow"
        >
          <Coins className="mr-2 h-5 w-5" />
          COLLECT WIN
        </Button>
      </div>
    </div>
  );
}
