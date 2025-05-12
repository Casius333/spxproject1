import { Socket } from 'socket.io-client';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// This file contains utility functions for testing Socket.IO functionality

/**
 * Creates a mock win notification
 * Note: For testing purposes only
 */
export function simulateWin(socket: Socket | null, amount: number = 50) {
  if (!socket) return;
  
  const testWin = {
    username: 'TestUser',
    amount,
    game: 'Test Slots',
    timestamp: Date.now()
  };
  
  socket.emit('win', testWin);
  
  toast({
    title: 'Test Win Notification Sent',
    description: `Simulated a win of ${formatCurrency(amount)}`,
    duration: 3000,
  });
}

/**
 * Creates a mock jackpot win notification
 * Note: For testing purposes only
 */
export function simulateJackpot(socket: Socket | null, amount: number = 5000) {
  if (!socket) return;
  
  const testJackpot = {
    username: 'JackpotWinner',
    amount,
    game: 'Mega Jackpot',
    timestamp: Date.now()
  };
  
  socket.emit('jackpot', testJackpot);
  
  toast({
    title: 'Test Jackpot Notification Sent',
    description: `Simulated a jackpot win of ${formatCurrency(amount)}`,
    duration: 3000,
  });
}

/**
 * Creates a mock balance update
 * Note: For testing purposes only
 */
export function simulateBalanceUpdate(socket: Socket | null, userId: string, newBalance: number) {
  if (!socket) return;
  
  socket.emit('balance_update', {
    userId,
    balance: newBalance
  });
  
  toast({
    title: 'Test Balance Update Sent',
    description: `Updated balance to ${formatCurrency(newBalance)}`,
    duration: 3000,
  });
}