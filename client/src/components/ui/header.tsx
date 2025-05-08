import { useState } from 'react';
import { Link } from 'wouter';
import { useBalanceContext } from '@/contexts/balance-context';
import { formatCurrency } from '@/lib/utils';
import { Dice5, User, Coins, ChevronDown } from 'lucide-react';

export function Header() {
  const [isBalanceHovered, setIsBalanceHovered] = useState(false);
  const { balance, isLoading } = useBalanceContext();

  return (
    <header className="bg-dark border-b border-primary/20 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <Dice5 className="text-primary text-3xl mr-2 animate-neon-glow" />
            <span className="font-heading font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:animate-neon-glow">
              LUCKY SPIN
            </span>
          </Link>
        </div>

        {/* Search Bar (Future Implementation) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-auto">
          {/* Search can be added here later */}
        </div>

        {/* User Controls */}
        <div className="flex items-center space-x-4">
          {/* Balance Display */}
          <div 
            className="relative group neon-border"
            onMouseEnter={() => setIsBalanceHovered(true)}
            onMouseLeave={() => setIsBalanceHovered(false)}
          >
            <div className="px-4 py-2 rounded-lg flex items-center bg-opacity-20 backdrop-blur-sm bg-dark-card">
              <Coins className="text-secondary mr-2 w-5 h-5 animate-pulse-fast" />
              <span className="font-bold text-white">
                {isLoading ? "$-.--" : formatCurrency(balance)}
              </span>
              <ChevronDown className="ml-1 w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className={`absolute right-0 mt-2 w-56 bg-dark-card rounded-lg shadow-xl border border-primary/30 transition-all duration-200 glass-effect ${
              isBalanceHovered ? 'opacity-100 visible transform scale-100' : 'opacity-0 invisible transform scale-95'
            }`}>
              <div className="p-4">
                <div className="flex justify-between mb-3">
                  <span className="text-muted-foreground">Available Balance:</span>
                  <span className="font-bold text-white">{formatCurrency(balance)}</span>
                </div>
                <button className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white rounded-md py-2 text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-primary/30">
                  DEPOSIT NOW
                </button>
              </div>
            </div>
          </div>

          {/* Sign In / Admin Button */}
          <div className="flex items-center space-x-3">
            <Link href="/admin">
              <div className="hidden md:inline-flex px-3 py-2 rounded-md text-white hover:text-primary font-medium transition-colors hover:bg-primary/10 text-sm cursor-pointer">
                Admin Panel
              </div>
            </Link>
            
            <div className="relative">
              <button className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent transition-all duration-300 px-5 py-2 rounded-lg font-bold text-dark shadow-lg hover:shadow-accent/30">
                <span className="hidden md:inline">SIGN IN</span>
                <User className="md:hidden w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
