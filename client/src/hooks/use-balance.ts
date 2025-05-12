import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketIO } from '@/hooks/use-socket-io';
import { useAuth } from '@/hooks/use-auth';

interface UseBalanceOptions {
  initialBalance?: number;
}

interface UseBalanceReturn {
  balance: number;
  updateBalance: (amount: number) => void;
  placeBet: (amount: number) => Promise<boolean>;
  addWin: (amount: number) => Promise<void>;
  isLoading: boolean;
}

export function useBalance(options: UseBalanceOptions = {}): UseBalanceReturn {
  const { initialBalance = 1000 } = options;
  const [balance, setBalance] = useState<number>(initialBalance);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Set up Socket.IO for real-time balance updates
  const { on } = useSocketIO({
    autoConnect: true,
    autoAuthenticate: true
  });
  
  // Listen for balance updates via Socket.IO
  useEffect(() => {
    // Handler for balance change events
    const handleBalanceChange = (data: { balance: number }) => {
      if (data.balance !== undefined) {
        setBalance(data.balance);
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      }
    };
    
    // Subscribe to balance change events
    on('balance_changed', handleBalanceChange);
    
    // Cleanup is handled by useSocketIO hook
  }, [on, queryClient]);
  
  // Fetch initial balance
  useEffect(() => {
    apiRequest('GET', '/api/balance')
      .then(res => res.json())
      .then(data => {
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
      })
      .catch(err => {
        console.error('Failed to fetch balance:', err);
        // Keep using initial balance in case of error
      });
  }, []);

  // Get the emit function from Socket.IO
  const { emit } = useSocketIO({
    autoConnect: true
  });

  const balanceMutation = useMutation({
    mutationFn: async ({ amount, action }: { amount: number, action: 'bet' | 'win' }) => {
      const response = await apiRequest('POST', '/api/balance', { amount, action });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setBalance(data.balance);
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      
      // Emit balance update event to sync across devices
      if (user) {
        emit('balance_update', { 
          userId: user.id,
          balance: data.balance 
        });
        
        // If this is a win, also emit a win notification
        if (data.lastTransaction?.type === 'win' && data.lastTransaction.amount > 0) {
          const winAmount = data.lastTransaction.amount;
          // Only broadcast larger wins (over $10)
          if (winAmount >= 10) {
            emit('win', {
              username: user.username || 'Player',
              amount: winAmount,
              game: 'Slots'
            });
          }
          
          // For jackpots (wins over $1000), broadcast to everyone
          if (winAmount >= 1000) {
            emit('jackpot', {
              username: user.username || 'Player',
              amount: winAmount,
              game: 'Slots'
            });
          }
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update balance',
        variant: 'destructive'
      });
    }
  });

  // Update balance (general function)
  const updateBalance = useCallback((amount: number) => {
    setBalance(prevBalance => prevBalance + amount);
  }, []);

  // Place a bet
  const placeBet = useCallback(async (amount: number): Promise<boolean> => {
    if (balance < amount) {
      toast({
        title: 'Insufficient balance',
        description: 'Please add more funds to continue playing.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      await balanceMutation.mutateAsync({ amount, action: 'bet' });
      return true;
    } catch (error) {
      return false;
    }
  }, [balance, balanceMutation, toast]);

  // Add a win
  const addWin = useCallback(async (amount: number): Promise<void> => {
    if (amount <= 0) return;
    
    try {
      await balanceMutation.mutateAsync({ amount, action: 'win' });
    } catch (error) {
      // Error is handled in mutation's onError
    }
  }, [balanceMutation]);

  return {
    balance,
    updateBalance,
    placeBet,
    addWin,
    isLoading: balanceMutation.isPending
  };
}
