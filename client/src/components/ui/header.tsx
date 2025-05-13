import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useBalanceContext } from '@/contexts/balance-context';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/contexts/auth-modal-context';
import { formatCurrency } from '@/lib/utils';
import { Coins, ChevronDown, LogIn, UserPlus, Menu } from 'lucide-react';
import { Button } from './button';
import { useSidebar } from './sidebar-nav';
import DepositDialog from '@/components/deposit-dialog';

export function Header() {
  const [isBalanceHovered, setIsBalanceHovered] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const { balance, isLoading } = useBalanceContext();
  const { user, logoutMutation } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-dark sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left spacer */}
        <div className="w-32"></div>

        {/* Centered Logo */}
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center group">
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
                
                <div className={`absolute right-0 mt-2 w-72 bg-dark-card rounded-lg shadow-xl border border-primary/30 transition-all duration-200 glass-effect ${
                  isBalanceHovered ? 'opacity-100 visible transform scale-100' : 'opacity-0 invisible transform scale-95'
                }`}>
                  <div className="p-4">
                    {/* Total Balance */}
                    <div className="flex justify-between mb-3 pb-2 border-b border-primary/20">
                      <span className="text-muted-foreground">Total Balance:</span>
                      <span className="font-bold text-white">{formatCurrency(balance)}</span>
                    </div>
                    
                    {/* Only show bonus info if there's a bonus */}
                    {bonusBalance > 0 && (
                      <>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="text-muted-foreground">Real Money:</span>
                          <span className="text-white">{formatCurrency(realBalance)}</span>
                        </div>
                        <div className="flex justify-between mb-3 text-sm">
                          <span className="text-muted-foreground">Bonus Funds:</span>
                          <span className="text-amber-400">{formatCurrency(bonusBalance)}</span>
                        </div>
                      </>
                    )}
                    
                    {/* Withdrawal Info */}
                    <div className="flex justify-between mb-3 text-sm">
                      <span className="text-muted-foreground">Available for Withdrawal:</span>
                      <span className="text-white">{formatCurrency(availableForWithdrawal)}</span>
                    </div>
                    
                    {/* Active Bonus Message */}
                    {hasActiveBonus && (
                      <div className="mb-3 p-2 bg-primary/10 rounded text-xs">
                        <p className="text-white">
                          You have an active bonus. Real money will be used first, then bonus funds.
                          <Link to="/promotions" className="text-primary hover:underline ml-1">
                            View Details
                          </Link>
                        </p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setIsDepositDialogOpen(true)}
                      className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white rounded-md py-2 text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
                    >
                      DEPOSIT NOW
                    </button>
                  </div>
                </div>
              </div>

              {/* Menu Toggle Button replacing Logout */}
              <div className="relative">
                <button 
                  className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent transition-all duration-300 px-3 py-2 rounded-lg font-bold text-dark shadow-lg hover:shadow-accent/30"
                  onClick={() => {
                    console.log("Header menu button clicked");
                    toggleSidebar();
                  }}
                  aria-label="Toggle Menu"
                  type="button"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Register and Login Buttons for non-logged in users */}
              <Button 
                className="bg-transparent border border-primary hover:bg-primary/20 text-white font-bold transition-all duration-300"
                onClick={() => openAuthModal('register')}
              >
                <UserPlus className="mr-1 h-4 w-4" />
                <span>Register</span>
              </Button>
              
              <Button 
                className="bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent transition-all duration-300 font-bold text-dark shadow-lg hover:shadow-accent/30"
                onClick={() => openAuthModal('login')}
              >
                <LogIn className="mr-1 h-4 w-4" />
                <span>Sign In</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Deposit Dialog */}
      <DepositDialog 
        isOpen={isDepositDialogOpen}
        onClose={() => setIsDepositDialogOpen(false)}
        selectedPromotion={null}
      />
    </header>
  );
}
