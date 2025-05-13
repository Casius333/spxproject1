import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useBalance } from '@/hooks/use-balance';

interface BalanceContextValue {
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

const BalanceContext = createContext<BalanceContextValue | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
  initialBalance?: number;
}

export function BalanceProvider({ children, initialBalance = 1000 }: BalanceProviderProps) {
  const {
    balance,
    realBalance,
    bonusBalance,
    availableForWithdrawal,
    hasActiveBonus,
    updateBalance,
    placeBet,
    addWin,
    isLoading,
    refreshBalance
  } = useBalance({ initialBalance });
  
  const balanceContextValue: BalanceContextValue = {
    balance,
    realBalance,
    bonusBalance,
    availableForWithdrawal,
    hasActiveBonus,
    updateBalance,
    placeBet,
    addWin,
    isLoading,
    refreshBalance
  };
  
  return (
    <BalanceContext.Provider value={balanceContextValue}>
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
