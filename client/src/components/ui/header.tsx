import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useBalanceContext } from '@/contexts/balance-context';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency } from '@/lib/utils';
import { Dice5, Coins, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { GiTopHat } from 'react-icons/gi';
import { Button } from './button';

export function Header() {
  const [isBalanceHovered, setIsBalanceHovered] = useState(false);
  const { balance, isLoading } = useBalanceContext();
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  return (
    <header className="bg-dark sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left spacer */}
        <div className="w-32"></div>

        {/* Centered Logo */}
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center group">
            <Dice5 className="text-primary text-4xl mr-3" />
            <span className="font-heading font-bold text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LUCKY SPIN
            </span>
          </Link>
        </div>

        {/* User Controls */}
        <div className="flex items-center space-x-4 w-[250px] justify-end">
          {/* Show these controls only when user is logged in */}
          {user ? (
            <>
              {/* Balance Display */}
              <div 
                className="relative group"
                onMouseEnter={() => setIsBalanceHovered(true)}
                onMouseLeave={() => setIsBalanceHovered(false)}
              >
                <div className="px-4 py-2 rounded-lg flex items-center bg-opacity-20 backdrop-blur-sm bg-dark-card">
                  <Coins className="text-secondary mr-2 w-5 h-5" />
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

              {/* Logout Button */}
              <div className="relative">
                <button 
                  className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent transition-all duration-300 px-5 py-2 rounded-lg font-bold text-dark shadow-lg hover:shadow-accent/30"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <span className="hidden md:inline mr-1">LOGOUT</span>
                  <GiTopHat className="md:inline w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Register and Login Buttons for non-logged in users */}
              <Button 
                size="sm"
                variant="outline"
                className="text-white border-primary hover:bg-primary/20"
                onClick={() => navigate('/auth?tab=register')}
              >
                <UserPlus className="mr-1 h-4 w-4" />
                <span>Register</span>
              </Button>
              
              <Button 
                className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent transition-all duration-300 font-bold text-dark shadow-lg hover:shadow-accent/30"
                onClick={() => navigate('/auth?tab=login')}
              >
                <LogIn className="mr-1 h-4 w-4" />
                <span>Sign In</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
