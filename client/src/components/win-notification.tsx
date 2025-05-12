import React, { useEffect, useState } from 'react';
import { useSocketIO } from '@/hooks/use-socket-io';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Trophy, Coins } from 'lucide-react';

interface WinNotification {
  username: string;
  amount: number;
  game: string;
  timestamp: number;
}

export function WinNotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<WinNotification[]>([]);
  
  // Initialize Socket.IO connection
  const { on } = useSocketIO({
    autoConnect: true,
    autoAuthenticate: true,
    onConnect: () => {
      console.log('Connected to notification service');
    }
  });
  
  // Listen for win notifications
  useEffect(() => {
    // Handler for regular win notifications
    const handleWinNotification = (data: WinNotification) => {
      // Add notification to the list
      setNotifications(prev => [...prev.slice(-9), {
        ...data,
        timestamp: Date.now()
      }]);
      
      // Show toast notification
      toast({
        title: 'New Win!',
        description: `${data.username} just won ${formatCurrency(data.amount)} on ${data.game}!`,
        duration: 5000,
      });
    };
    
    // Handler for jackpot notifications
    const handleJackpotNotification = (data: WinNotification) => {
      // Add notification to the list
      setNotifications(prev => [...prev.slice(-9), {
        ...data,
        timestamp: Date.now()
      }]);
      
      // Show toast notification for jackpot with custom styling
      toast({
        title: 'JACKPOT WINNER! 🏆',
        description: `${data.username} just won a massive ${formatCurrency(data.amount)} jackpot on ${data.game}!`,
        duration: 8000,
        variant: 'jackpot',
      });
    };
    
    // Subscribe to win and jackpot notifications
    on('win_notification', handleWinNotification);
    on('jackpot_notification', handleJackpotNotification);
    
    // Cleanup
    return () => {
      // Socket.IO events are automatically cleaned up by the useSocketIO hook
    };
  }, [on, toast]);
  
  return <>{children}</>;
}

export function RecentWins() {
  const [wins, setWins] = useState<WinNotification[]>([]);
  
  // Initialize Socket.IO connection
  const { on } = useSocketIO({
    autoConnect: true,
    onConnect: () => {
      console.log('Connected to win feed');
    }
  });
  
  // Listen for win notifications
  useEffect(() => {
    const handleWin = (data: WinNotification) => {
      setWins(prev => [
        { ...data, timestamp: Date.now() },
        ...prev.slice(0, 4) // Keep only latest 5 wins
      ]);
    };
    
    const handleJackpot = (data: WinNotification) => {
      setWins(prev => [
        { ...data, timestamp: Date.now(), isJackpot: true },
        ...prev.slice(0, 4) // Keep only latest 5 wins
      ]);
    };
    
    on('win_notification', handleWin);
    on('jackpot_notification', handleJackpot);
    
    // Cleanup is handled by the useSocketIO hook
  }, [on]);
  
  if (wins.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-dark-card/60 rounded-lg p-3 border border-border/40 max-w-md">
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <Trophy className="h-4 w-4 text-primary mr-2" /> 
        Recent Wins
      </h3>
      <div className="space-y-2">
        {wins.map((win, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between text-xs p-2 rounded ${
              win.isJackpot ? 'bg-primary/20 border border-primary/40' : 'bg-dark/40'
            }`}
          >
            <div className="flex items-center">
              <Coins className="h-3 w-3 text-primary mr-1" />
              <span className="truncate max-w-[100px]">{win.username}</span>
              <span className="text-muted-foreground ml-2 truncate max-w-[80px]">{win.game}</span>
            </div>
            <span className={`font-medium ${win.isJackpot ? 'text-primary' : ''}`}>
              {formatCurrency(win.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}