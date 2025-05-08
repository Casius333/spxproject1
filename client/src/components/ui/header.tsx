import { useState } from 'react';
import { Link } from 'wouter';
import { useBalanceContext } from '@/contexts/balance-context';
import { formatCurrency } from '@/lib/utils';
import { Dice5, User, Menu, Coins, ChevronDown } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Slots', href: '/' },
  { label: 'Jackpots', href: '/jackpots' },
  { label: 'New Games', href: '/new-games' },
  { label: 'Popular', href: '/popular' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <nav>
            <ul className="flex space-x-6">
              {MENU_ITEMS.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.href}
                    className="text-white hover:text-primary transition-colors font-medium py-2 border-b-2 border-transparent hover:border-primary text-base relative group"
                  >
                    {item.label}
                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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

          {/* Sign In Button */}
          <div className="relative">
            <button className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent transition-all duration-300 px-5 py-2 rounded-lg font-bold text-dark shadow-lg hover:shadow-accent/30">
              <span className="hidden md:inline">SIGN IN</span>
              <User className="md:hidden w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-2xl text-white hover:text-primary transition-colors" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-dark-card border-t border-primary/20 glass-effect`}>
        <nav className="container mx-auto px-4 py-3">
          <ul className="space-y-3">
            {MENU_ITEMS.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.href}
                  className="block py-3 px-4 hover:bg-primary/10 rounded-md transition-colors text-white hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
