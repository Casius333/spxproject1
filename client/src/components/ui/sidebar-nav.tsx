import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useProfileDialog } from "@/contexts/profile-dialog-context";
import DepositDialog from "@/components/deposit-dialog";
import { Menu, Home, Wallet, User, LogOut, CreditCard, Gift } from "lucide-react";

// Create sidebar context
interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// Provider component
interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSidebar = () => {
    console.log("Toggling sidebar", !isOpen);
    setIsOpen(prev => !prev);
  };
  
  const closeSidebar = () => {
    console.log("Closing sidebar");
    setIsOpen(false);
  };
  
  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface SidebarNavProps {
  className?: string;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
  { label: "Deposit", href: "/deposit", icon: <Wallet className="w-5 h-5" /> },
  { label: "Withdrawal", href: "/withdrawal", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Promotions", href: "/promotions", icon: <Gift className="w-5 h-5" /> },
  { label: "Logout", href: "/logout", icon: <LogOut className="w-5 h-5" /> },
];

export function SidebarNav({ className }: SidebarNavProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar();
  const { openProfile } = useProfileDialog();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);

  // Determine if an item is active
  const isActiveLink = (href: string) => {
    return location === href || 
      (href !== "/" && location.startsWith(href));
  };

  // Handle sidebar item clicks
  const handleNavItemClick = (href: string, e: React.MouseEvent<HTMLDivElement>) => {
    // Close sidebar completely first
    closeSidebar();
    
    if (href === '/logout') {
      e.preventDefault();
      // Short delay to ensure sidebar is closed first
      setTimeout(() => {
        logoutMutation.mutate();
      }, 100);
      return;
    }
    
    if (href === '/profile') {
      e.preventDefault();
      // Short delay to ensure sidebar is closed first
      setTimeout(() => {
        openProfile();
      }, 100);
      return;
    }
    
    if (href === '/deposit') {
      e.preventDefault();
      // Short delay to ensure sidebar is closed first
      setTimeout(() => {
        setIsDepositDialogOpen(true);
      }, 100);
      return;
    }
  };

  // Only show sidebar for logged-in users
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Background Overlay - shown when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[51]"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Deposit Dialog */}
      <DepositDialog 
        open={isDepositDialogOpen} 
        onOpenChange={setIsDepositDialogOpen} 
      />

      {/* Floating Sidebar */}
      <aside
        className={cn(
          "fixed top-16 right-4 z-[55] flex flex-col transition-all duration-300 rounded-lg overflow-hidden w-60",
          isOpen 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-full pointer-events-none",
          className
        )}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col bg-dark shadow-xl border border-primary/20 overflow-hidden">
          {/* Navigation Links */}
          <nav className="space-y-1 p-4 py-3">
            {NAV_ITEMS.map((item) => (
              <div key={item.href} onClick={(e) => handleNavItemClick(item.href, e)}>
                {item.href === '/profile' ? (
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors relative group cursor-pointer",
                      "text-white hover:text-primary"
                    )}
                  >
                    <span className="flex items-center justify-center mr-3 text-primary">
                      {item.icon}
                    </span>
                    <span className="transition-opacity">
                      {item.label}
                    </span>
                  </div>
                ) : item.href === '/deposit' ? (
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors relative group cursor-pointer",
                      "text-white hover:text-primary"
                    )}
                    onClick={() => {
                      // Hide the sidebar completely before opening dialog
                      closeSidebar();
                      // Short delay before opening dialog for better visual transition
                      setTimeout(() => {
                        setIsDepositDialogOpen(true);
                      }, 100);
                    }}
                  >
                    <span className="flex items-center justify-center mr-3 text-primary">
                      {item.icon}
                    </span>
                    <span className="transition-opacity">
                      {item.label}
                    </span>
                  </div>
                ) : item.href !== '/logout' ? (
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors relative group cursor-pointer",
                        isActiveLink(item.href)
                          ? "text-primary bg-primary/10"
                          : "text-white hover:text-primary"
                      )}
                    >
                      <span className="flex items-center justify-center mr-3 text-primary">
                        {item.icon}
                      </span>
                      <span className="transition-opacity">
                        {item.label}
                      </span>
                      
                      {/* Active indicator */}
                      {isActiveLink(item.href) && (
                        <span className="absolute inset-y-0 left-0 w-1 bg-primary rounded-tr-md rounded-br-md animate-pulse-fast" />
                      )}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      logoutMutation.mutate();
                      toggleSidebar();
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors relative group cursor-pointer text-white hover:text-primary"
                  >
                    <span className="flex items-center justify-center mr-3 text-primary">
                      {item.icon}
                    </span>
                    <span className="transition-opacity text-left">
                      {item.label}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}