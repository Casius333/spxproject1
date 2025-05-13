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
  realBalance: number;
  bonusBalance: number;
  availableForWithdrawal: number;
  hasActiveBonus: boolean;
  updateBalance: (amount: number) => void;
  placeBet: (amount: number) => Promise<boolean>;
  addWin: (amount: number) => Promise<void>;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

export function useBalance(options: UseBalanceOptions = {}): UseBalanceReturn {
  const { initialBalance = 1000 } = options;
  const [balance, setBalance] = useState<number>(initialBalance);
  const [realBalance, setRealBalance] = useState<number>(initialBalance);
  const [bonusBalance, setBonusBalance] = useState<number>(0);
  const [availableForWithdrawal, setAvailableForWithdrawal] = useState<number>(initialBalance);
  const [hasActiveBonus, setHasActiveBonus] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Set up Socket.IO for real-time balance updates
  const { on } = useSocketIO({
    autoConnect: true,
    autoAuthenticate: true
  });
  
  // Function to refresh balance data
  const refreshBalance = useCallback(async () => {
    try {
      const res = await apiRequest('GET', '/api/balance');
      const data = await res.json();
      
      if (data) {
        // Set total balance
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
        
        // Set bonus balance if available
        if (data.bonusBalance !== undefined) {
          setBonusBalance(data.bonusBalance);
          setRealBalance(data.balance - data.bonusBalance);
        } else {
          // If no bonus info, assume all is real money
          setRealBalance(data.balance);
          setBonusBalance(0);
        }
        
        // Set available for withdrawal
        if (data.availableForWithdrawal !== undefined) {
          setAvailableForWithdrawal(data.availableForWithdrawal);
        } else {
          // If no withdrawal info, assume same as real balance
          setAvailableForWithdrawal(data.bonusBalance !== undefined ? data.balance - data.bonusBalance : data.balance);
        }
        
        // Set active bonus flag
        setHasActiveBonus(data.hasActiveBonus === true || data.bonusBalance > 0);
      }
    } catch (err) {
      console.error('Failed to fetch balance details:', err);
    }
  }, []);
  
  // Listen for balance updates via Socket.IO
  useEffect(() => {
    // Handler for balance change events
    const handleBalanceChange = (data: { 
      balance: number,
      bonusBalance?: number,
      availableForWithdrawal?: number,
      hasActiveBonus?: boolean
    }) => {
      console.log('balance_changed event received:', data);
      if (data.balance !== undefined) {
        setBalance(data.balance);
        
        // Update bonus balance if provided
        if (data.bonusBalance !== undefined) {
          setBonusBalance(data.bonusBalance);
          setRealBalance(data.balance - data.bonusBalance);
        } else {
          // If no bonus balance provided, assume it's all real money
          setRealBalance(data.balance);
          setBonusBalance(0);
        }
        
        // Update available for withdrawal if provided
        if (data.availableForWithdrawal !== undefined) {
          setAvailableForWithdrawal(data.availableForWithdrawal);
        } else {
          // If no withdrawal info, assume same as real balance (if no active bonus)
          if (data.hasActiveBonus !== true) {
            setAvailableForWithdrawal(data.bonusBalance !== undefined ? data.balance - data.bonusBalance : data.balance);
          }
        }
        
        // Update active bonus flag if provided
        if (data.hasActiveBonus !== undefined) {
          setHasActiveBonus(data.hasActiveBonus);
        } else if (data.bonusBalance !== undefined) {
          // If hasActiveBonus not provided but bonusBalance is, infer from bonus amount
          setHasActiveBonus(data.bonusBalance > 0);
        }
        
        // Refresh the balance data in react-query cache
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      }
    };
    
    // Handler for deposit/withdrawal balance updates
    const handleBalanceUpdate = (data: { 
      balance: number, 
      type: string, 
      amount: number,
      bonusBalance?: number,
      availableForWithdrawal?: number,
      hasActiveBonus?: boolean
    }) => {
      console.log('balance_update event received:', data);
      if (data.balance !== undefined) {
        setBalance(data.balance);
        
        // Update bonus balance if provided
        if (data.bonusBalance !== undefined) {
          setBonusBalance(data.bonusBalance);
          setRealBalance(data.balance - data.bonusBalance);
        } else {
          // If no bonus balance provided, assume it's all real money
          setRealBalance(data.balance);
          setBonusBalance(0);
        }
        
        // Update available for withdrawal if provided
        if (data.availableForWithdrawal !== undefined) {
          setAvailableForWithdrawal(data.availableForWithdrawal);
        } else {
          // If no withdrawal info, assume same as real balance (if no active bonus)
          if (data.hasActiveBonus !== true) {
            setAvailableForWithdrawal(data.bonusBalance !== undefined ? data.balance - data.bonusBalance : data.balance);
          }
        }
        
        // Update active bonus flag if provided
        if (data.hasActiveBonus !== undefined) {
          setHasActiveBonus(data.hasActiveBonus);
        } else if (data.bonusBalance !== undefined) {
          // If hasActiveBonus not provided but bonusBalance is, infer from bonus amount
          setHasActiveBonus(data.bonusBalance > 0);
        }
        
        // Always refresh the balance after a socket update
        queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
        
        // Show toast notification for specific events
        if (data.type === 'deposit') {
          toast({
            title: 'Deposit Successful',
            description: `$${data.amount.toFixed(2)} has been added to your account.`,
            variant: 'default',
          });
        } else if (data.type === 'bonus' && data.amount < 0) {
          toast({
            title: 'Promotion Cancelled',
            description: `$${Math.abs(data.amount).toFixed(2)} bonus funds have been removed from your account.`,
            variant: 'default',
          });
        }
      }
    };
    
    // Subscribe to balance change events
    on('balance_changed', handleBalanceChange);
    on('balance_update', handleBalanceUpdate);
    
    // Cleanup is handled by useSocketIO hook
  }, [on, queryClient, toast]);
  
  // Fetch initial balance
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

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
      // Update total balance
      setBalance(data.balance);
      
      // Update bonus balance if provided
      if (data.bonusBalance !== undefined) {
        setBonusBalance(data.bonusBalance);
        setRealBalance(data.balance - data.bonusBalance);
      }
      
      // Update available for withdrawal if provided
      if (data.availableForWithdrawal !== undefined) {
        setAvailableForWithdrawal(data.availableForWithdrawal);
      }
      
      // Update active bonus flag if provided
      if (data.hasActiveBonus !== undefined) {
        setHasActiveBonus(data.hasActiveBonus);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      
      // Emit balance update event to sync across devices
      if (user) {
        emit('balance_update', { 
          userId: user.id,
          balance: data.balance,
          bonusBalance: data.bonusBalance,
          availableForWithdrawal: data.availableForWithdrawal,
          hasActiveBonus: data.hasActiveBonus
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
    realBalance,
    bonusBalance,
    availableForWithdrawal,
    hasActiveBonus,
    updateBalance,
    placeBet,
    addWin,
    isLoading: balanceMutation.isPending,
    refreshBalance
  };
}
