import { useState, useCallback, useRef } from 'react';
import { delay, randomNumber } from '@/lib/utils';
import { useBalance } from '@/hooks/use-balance';
import { useWebSocket } from '@/hooks/use-websocket';

// Symbol definitions
export const SYMBOLS = [
  { id: 1, name: 'cherry', value: 2, image: 'https://cdn-icons-png.flaticon.com/512/2413/2413091.png' },
  { id: 2, name: 'lemon', value: 2, image: 'https://cdn-icons-png.flaticon.com/512/2413/2413153.png' },
  { id: 3, name: 'orange', value: 3, image: 'https://cdn-icons-png.flaticon.com/512/2413/2413045.png' },
  { id: 4, name: 'watermelon', value: 4, image: 'https://cdn-icons-png.flaticon.com/512/2413/2413089.png' },
  { id: 5, name: 'bell', value: 5, image: 'https://cdn-icons-png.flaticon.com/512/2168/2168960.png' },
  { id: 6, name: 'seven', value: 10, image: 'https://cdn-icons-png.flaticon.com/512/3280/3280971.png' },
  { id: 7, name: 'diamond', value: 20, image: 'https://cdn-icons-png.flaticon.com/512/2168/2168939.png' },
  { id: 8, name: 'star', value: 15, image: 'https://cdn-icons-png.flaticon.com/512/2168/2168945.png' },
];

export interface Symbol {
  id: number;
  name: string;
  value: number;
  image: string;
}

interface UseSlotMachineOptions {
  reels?: number;
  symbols?: Symbol[];
  initialBet?: number;
  minBet?: number;
  maxBet?: number;
}

interface UseSlotMachineReturn {
  reelState: Symbol[][];
  isSpinning: boolean;
  betAmount: number;
  winAmount: number;
  spinReels: () => Promise<void>;
  increaseBet: () => void;
  decreaseBet: () => void;
  setBet: (amount: number) => void;
}

export function useSlotMachine(options: UseSlotMachineOptions = {}): UseSlotMachineReturn {
  const {
    reels = 5,
    symbols = SYMBOLS,
    initialBet = 1,
    minBet = 0.5,
    maxBet = 100
  } = options;
  
  const [reelState, setReelState] = useState<Symbol[][]>(Array(reels).fill([]).map(() => 
    Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)])
  ));
  
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<number>(initialBet);
  const [winAmount, setWinAmount] = useState<number>(0);
  
  const { placeBet, addWin } = useBalance();
  
  // Connect to WebSocket for real-time updates
  const { sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'win') {
        // Handle external win event
        setWinAmount(data.amount);
      }
    }
  });
  
  // Reference for the last spin result
  const lastSpinRef = useRef<{ 
    symbols: Symbol[][], 
    lines: number[][], 
    win: number 
  } | null>(null);
  
  // Spin the reels
  const spinReels = useCallback(async () => {
    if (isSpinning) return;
    
    // Place bet
    const success = await placeBet(betAmount);
    if (!success) return;
    
    setIsSpinning(true);
    setWinAmount(0);
    
    // Notify other clients via WebSocket
    sendMessage({ type: 'spin_start', bet: betAmount });
    
    // Generate new reel states
    const newReelState: Symbol[][] = [];
    
    for (let i = 0; i < reels; i++) {
      // Add delay between each reel
      await delay(200 * i);
      
      // Generate random symbols for this reel
      const reelSymbols = Array(3).fill(null).map(() => 
        symbols[Math.floor(Math.random() * symbols.length)]
      );
      
      newReelState[i] = reelSymbols;
      
      // Update state for each reel to show animation
      setReelState(prev => {
        const updated = [...prev];
        updated[i] = reelSymbols;
        return updated;
      });
    }
    
    // Calculate win
    await calculateWin(newReelState);
    
    setIsSpinning(false);
  }, [isSpinning, betAmount, placeBet, reels, symbols, sendMessage]);
  
  // Calculate win based on symbols
  const calculateWin = useCallback(async (finalReels: Symbol[][]) => {
    await delay(500); // Delay to let animations finish
    
    // Check for wins (middle row for simplicity)
    const middleRow = finalReels.map(reel => reel[1]);
    
    // Check for matching symbols
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    let currentSymbol = middleRow[0];
    
    for (let i = 1; i < middleRow.length; i++) {
      if (middleRow[i].id === currentSymbol.id) {
        currentConsecutive++;
        if (currentConsecutive > maxConsecutive) {
          maxConsecutive = currentConsecutive;
        }
      } else {
        currentSymbol = middleRow[i];
        currentConsecutive = 1;
      }
    }
    
    // Calculate win amount based on matches and symbol value
    let win = 0;
    
    if (maxConsecutive >= 3) {
      const winningSymbol = middleRow.find((symbol, index) => 
        middleRow.slice(index, index + maxConsecutive).every(s => s.id === symbol.id)
      );
      
      if (winningSymbol) {
        win = betAmount * winningSymbol.value * (maxConsecutive - 2);
      }
    }
    
    // Random win chance (20% chance of winning even without matching symbols)
    if (win === 0 && Math.random() < 0.2) {
      win = betAmount * randomNumber(1, 5);
    }
    
    // Store the result
    lastSpinRef.current = {
      symbols: finalReels,
      lines: [middleRow.map(s => s.id)],
      win
    };
    
    if (win > 0) {
      setWinAmount(win);
      await addWin(win);
      
      // Notify other clients via WebSocket
      sendMessage({ 
        type: 'win', 
        amount: win, 
        betAmount, 
        symbols: finalReels.map(reel => reel.map(s => s.id)) 
      });
    }
    
  }, [betAmount, addWin, sendMessage]);
  
  // Increase bet amount
  const increaseBet = useCallback(() => {
    if (isSpinning) return;
    setBetAmount(prev => Math.min(maxBet, prev + 0.5));
  }, [isSpinning, maxBet]);
  
  // Decrease bet amount
  const decreaseBet = useCallback(() => {
    if (isSpinning) return;
    setBetAmount(prev => Math.max(minBet, prev - 0.5));
  }, [isSpinning, minBet]);
  
  // Set specific bet amount
  const setBet = useCallback((amount: number) => {
    if (isSpinning) return;
    const validAmount = Math.max(minBet, Math.min(maxBet, amount));
    setBetAmount(validAmount);
  }, [isSpinning, minBet, maxBet]);
  
  return {
    reelState,
    isSpinning,
    betAmount,
    winAmount,
    spinReels,
    increaseBet,
    decreaseBet,
    setBet
  };
}
