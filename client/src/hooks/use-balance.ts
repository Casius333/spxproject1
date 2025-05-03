import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

  const balanceMutation = useMutation({
    mutationFn: async ({ amount, action }: { amount: number, action: 'bet' | 'win' }) => {
      const response = await apiRequest('POST', '/api/balance', { amount, action });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setBalance(data.balance);
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
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
