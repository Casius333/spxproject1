import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useBalance } from '@/hooks/use-balance';

interface BalanceContextValue {
  balance: number;
  updateBalance: (amount: number) => void;
  placeBet: (amount: number) => Promise<boolean>;
  addWin: (amount: number) => Promise<void>;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextValue | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
  initialBalance?: number;
}

export function BalanceProvider({ children, initialBalance = 1000 }: BalanceProviderProps) {
  const balanceHook = useBalance({ initialBalance });
  
  return (
    <BalanceContext.Provider value={balanceHook}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext(): BalanceContextValue {
  const context = useContext(BalanceContext);
  
  if (context === undefined) {
    throw new Error('useBalanceContext must be used within a BalanceProvider');
  }
  
  return context;
}
