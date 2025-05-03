import { useState } from 'react';
import { Link } from 'wouter';
import { useBalanceContext } from '@/contexts/balance-context';
import { formatCurrency } from '@/lib/utils';
import { Dice5, User, Menu } from 'lucide-react';

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
    <header className="bg-dark-light border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Dice5 className="text-secondary text-3xl mr-2" />
            <span className="font-heading font-bold text-2xl bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              SpinVerse
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <nav>
            <ul className="flex space-x-4">
              {MENU_ITEMS.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.href}
                    className="hover:text-secondary transition-colors py-2 border-b-2 border-transparent hover:border-secondary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div 
            className="relative group"
            onMouseEnter={() => setIsBalanceHovered(true)}
            onMouseLeave={() => setIsBalanceHovered(false)}
          >
            <div className="bg-dark-card px-4 py-2 rounded-lg flex items-center border border-gray-700">
              <svg className="text-secondary mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              <span className="font-semibold">
                {isLoading ? "$-.--" : formatCurrency(balance)}
              </span>
            </div>
            
            <div className={`absolute right-0 mt-2 w-48 bg-dark-card rounded-lg shadow-lg border border-gray-700 transition-all duration-200 ${
              isBalanceHovered ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}>
              <div className="p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Available:</span>
                  <span className="font-semibold">{formatCurrency(balance)}</span>
                </div>
                <button className="w-full bg-secondary hover:bg-secondary-light text-white rounded py-1.5 text-sm font-medium transition-colors">
                  Deposit
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <button className="bg-primary hover:bg-primary-light transition-colors px-4 py-2 rounded-lg font-medium">
              <span className="hidden md:inline">Sign In</span>
              <User className="md:hidden w-5 h-5" />
            </button>
          </div>

          <button 
            className="md:hidden text-2xl" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-dark-light border-t border-gray-800`}>
        <nav className="container mx-auto px-4 py-3">
          <ul className="space-y-2">
            {MENU_ITEMS.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.href}
                  className="block py-2 px-3 hover:bg-dark-card rounded transition-colors"
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
