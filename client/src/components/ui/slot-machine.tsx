import { useState, useEffect } from 'react';
import { useSlotMachine, SYMBOLS } from '@/hooks/use-slot-machine';
import { useBalanceContext } from '@/contexts/balance-context';
import { formatCurrency } from '@/lib/utils';
import { WinNotification } from '@/components/ui/win-notification';
import { Volume2, HelpCircle, X, Minus, Plus, Coins, Flame, Trophy, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

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
    <div className="max-w-5xl mx-auto neon-border bg-dark-card rounded-xl shadow-2xl overflow-hidden">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-primary-dark to-primary py-4 px-6 flex justify-between items-center">
        <div>
          <h3 className="font-heading font-bold text-2xl text-white animate-neon-glow">COSMIC JACKPOT</h3>
          <div className="flex items-center mt-1">
            <Flame className="w-4 h-4 text-secondary mr-1" />
            <p className="text-xs text-muted-foreground">96.5% RTP | High Volatility</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/">
            <div className="bg-dark/50 hover:bg-primary/70 rounded-full px-4 py-2 flex items-center justify-center transition-colors backdrop-blur-sm cursor-pointer">
              <ArrowLeft className="text-white mr-1" size={16} />
              <span className="text-white text-sm font-medium">Exit Game</span>
            </div>
          </Link>
          <button className="bg-dark/30 hover:bg-dark/50 rounded-full w-9 h-9 flex items-center justify-center transition-colors backdrop-blur-sm">
            <Volume2 className="text-white/80 hover:text-white" size={16} />
          </button>
          <button className="bg-dark/30 hover:bg-dark/50 rounded-full w-9 h-9 flex items-center justify-center transition-colors backdrop-blur-sm">
            <HelpCircle className="text-white/80 hover:text-white" size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-8 bg-gradient-to-b from-dark to-dark-card">
        {/* Jackpot Display */}
        <div className="flex justify-center mb-4">
          <div className="bg-dark-light/50 px-6 py-2 rounded-full backdrop-blur-sm flex items-center shadow-lg">
            <Trophy className="text-secondary animate-pulse-fast mr-2" size={18} />
            <span className="text-secondary font-bold animate-jackpot-flash">JACKPOT: $25,000.00</span>
          </div>
        </div>

        {/* Slot Reels */}
        <div className="glass-effect rounded-lg p-6 mb-8 shadow-inner backdrop-blur">
          <div className="grid grid-cols-5 gap-3 h-60">
            {reelState.map((reel, reelIndex) => (
              <div 
                key={reelIndex} 
                className="relative overflow-hidden bg-dark-light/80 rounded-lg shadow-lg border-t border-primary/20 border-b border-primary/20"
              >
                <div className={`absolute inset-0 flex flex-col items-center pt-16 ${isSpinning ? 'animate-reel' : ''}`}>
                  {reel.map((symbol, symbolIndex) => (
                    <img 
                      key={symbolIndex} 
                      src={symbol.image} 
                      alt={symbol.name} 
                      className="w-20 h-20 mb-4 object-contain drop-shadow-lg"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Game Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Display */}
          <div className="bg-dark/60 glass-effect rounded-xl p-4 flex flex-col items-center justify-center shadow-lg">
            <p className="text-muted-foreground text-sm mb-1">BALANCE</p>
            <div className="flex items-center">
              <Coins className="text-secondary mr-2 w-5 h-5" />
              <p className="text-xl font-bold text-white">{formatCurrency(balance)}</p>
            </div>
          </div>
          
          {/* Bet Amount Control */}
          <div className="bg-dark/60 glass-effect rounded-xl p-4 flex flex-col items-center justify-center shadow-lg">
            <p className="text-muted-foreground text-sm mb-1">BET AMOUNT</p>
            <div className="flex items-center">
              <button 
                onClick={decreaseBet}
                disabled={isSpinning}
                className="bg-primary/30 hover:bg-primary/50 w-9 h-9 rounded-md flex items-center justify-center transition-colors disabled:opacity-50 backdrop-blur-sm"
              >
                <Minus className="text-white" size={16} />
              </button>
              <p className="mx-5 text-xl font-bold text-white">{formatCurrency(betAmount)}</p>
              <button 
                onClick={increaseBet}
                disabled={isSpinning}
                className="bg-primary/30 hover:bg-primary/50 w-9 h-9 rounded-md flex items-center justify-center transition-colors disabled:opacity-50 backdrop-blur-sm"
              >
                <Plus className="text-white" size={16} />
              </button>
            </div>
          </div>
          
          {/* Win Display */}
          <div className={`bg-dark/60 glass-effect rounded-xl p-4 flex flex-col items-center justify-center shadow-lg ${winAmount > 0 ? 'border border-secondary/50 animate-neon-glow' : ''}`}>
            <p className="text-muted-foreground text-sm mb-1">WIN</p>
            <p className={`text-xl font-bold ${winAmount > 0 ? 'text-secondary' : 'text-white'}`}>
              {formatCurrency(winAmount)}
            </p>
          </div>
        </div>
        
        {/* Spin Button */}
        <div className="flex flex-col items-center">
          <button 
            onClick={spinReels}
            disabled={isSpinning || balance < betAmount}
            className={`
              relative overflow-hidden
              bg-gradient-to-r from-secondary-dark to-secondary
              hover:from-secondary hover:to-secondary-light
              transition-all duration-300
              text-dark font-heading font-bold text-xl
              py-5 px-16 rounded-full
              shadow-lg hover:shadow-secondary/30
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isSpinning ? 'cursor-not-allowed animate-pulse-fast' : 'animate-neon-glow'}
              mb-6
            `}
          >
            {isSpinning ? 'SPINNING...' : 'SPIN'}
            {/* Spin shine effect */}
            <div className={`absolute top-0 left-0 w-full h-full bg-white/20 transform ${isSpinning ? 'scale-x-100 -skew-x-12' : 'scale-x-0'} transition-transform duration-500`}></div>
          </button>
          
          <Link href="/">
            <div className="bg-dark/80 hover:bg-primary/30 py-3 px-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-primary/20">
              <Home className="text-white mr-2" size={18} />
              <span className="text-white text-sm font-medium">Back to Home</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Win Notification */}
      <WinNotification 
        winAmount={winAmount} 
        isVisible={showWinNotification} 
        onCollect={handleCollectWin} 
      />
    </div>
  );
}
