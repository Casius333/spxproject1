import { useState, useEffect } from 'react';
import { useSlotMachine, SYMBOLS } from '@/hooks/use-slot-machine';
import { useBalanceContext } from '@/contexts/balance-context';
import { formatCurrency } from '@/lib/utils';
import { WinNotification } from '@/components/ui/win-notification';
import { Volume2, HelpCircle, X, Minus, Plus } from 'lucide-react';

export function SlotMachine() {
  const {
    reelState,
    isSpinning,
    betAmount,
    winAmount,
    spinReels,
    increaseBet,
    decreaseBet,
  } = useSlotMachine();
  
  const { balance } = useBalanceContext();
  const [showWinNotification, setShowWinNotification] = useState(false);
  
  useEffect(() => {
    if (winAmount > 0) {
      setShowWinNotification(true);
    }
  }, [winAmount]);
  
  const handleCollectWin = () => {
    setShowWinNotification(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-dark-card rounded-xl border border-gray-800 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-primary-dark py-4 px-6 flex justify-between items-center">
        <div>
          <h3 className="font-heading font-bold text-xl">Cosmic Fortune</h3>
          <p className="text-xs text-gray-300">by SpinVerse Studios</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-dark-card hover:bg-dark-light rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <Volume2 className="text-gray-300" size={16} />
          </button>
          <button className="bg-dark-card hover:bg-dark-light rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <HelpCircle className="text-gray-300" size={16} />
          </button>
          <button className="bg-dark-card hover:bg-dark-light rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <X className="text-gray-300" size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="bg-dark rounded-lg p-4 mb-6">
          <div className="grid grid-cols-5 gap-2 h-48">
            {/* Slot reels */}
            {reelState.map((reel, reelIndex) => (
              <div key={reelIndex} className="relative overflow-hidden bg-dark-light rounded-md border border-gray-700">
                <div className={`absolute inset-0 flex flex-col items-center pt-12 ${isSpinning ? 'animate-reel' : ''}`}>
                  {reel.map((symbol, symbolIndex) => (
                    <img 
                      key={symbolIndex} 
                      src={symbol.image} 
                      alt={symbol.name} 
                      className="w-16 h-16 mb-4 object-contain"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark rounded-lg p-4 flex flex-col items-center justify-center">
            <p className="text-gray-400 text-sm mb-1">Balance</p>
            <p className="text-xl font-semibold">{formatCurrency(balance)}</p>
          </div>
          <div className="bg-dark rounded-lg p-4 flex flex-col items-center justify-center">
            <p className="text-gray-400 text-sm mb-1">Bet Amount</p>
            <div className="flex items-center">
              <button 
                onClick={decreaseBet}
                disabled={isSpinning}
                className="bg-dark-light hover:bg-gray-700 w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Minus className="text-sm" size={14} />
              </button>
              <p className="mx-4 text-xl font-semibold">{formatCurrency(betAmount)}</p>
              <button 
                onClick={increaseBet}
                disabled={isSpinning}
                className="bg-dark-light hover:bg-gray-700 w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Plus className="text-sm" size={14} />
              </button>
            </div>
          </div>
          <div className="bg-dark rounded-lg p-4 flex flex-col items-center justify-center">
            <p className="text-gray-400 text-sm mb-1">Win</p>
            <p className="text-xl font-semibold">{formatCurrency(winAmount)}</p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={spinReels}
            disabled={isSpinning || balance < betAmount}
            className={`bg-secondary hover:bg-secondary-light transition-colors text-gray-900 font-heading font-bold text-xl py-4 px-12 rounded-full disabled:opacity-50 ${isSpinning ? 'cursor-not-allowed' : ''}`}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>
      </div>
      
      <WinNotification 
        winAmount={winAmount} 
        isVisible={showWinNotification} 
        onCollect={handleCollectWin} 
      />
    </div>
  );
}
