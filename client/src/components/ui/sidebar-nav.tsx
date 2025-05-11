import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Home, Wallet, User, LogOut } from "lucide-react";

interface SidebarNavProps {
  className?: string;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
  { label: "Cashier", href: "/cashier", icon: <Wallet className="w-5 h-5" /> },
  { label: "Profile", href: "/profile", icon: <User className="w-5 h-5" /> },
  { label: "Logout", href: "/logout", icon: <LogOut className="w-5 h-5" /> },
];

export function SidebarNav({ className }: SidebarNavProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Close sidebar when location changes
    setIsOpen(false);
  }, [location]);

  // Determine if an item is active
  const isActiveLink = (href: string) => {
    return location === href || 
      (href !== "/" && location.startsWith(href));
  };

  // Handle special sidebar item clicks
  const handleNavItemClick = (href: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (href === '/logout') {
      e.preventDefault();
      logoutMutation.mutate();
      navigate('/auth');
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[51]"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Toggle Button - z-index higher than header (only for logged in users) - Now moved to header */}
      {/* Hidden from view since we'll add it to the header */}
      <button
        className="hidden fixed top-4 right-4 z-[60] flex items-center justify-center w-12 h-12 rounded border border-white/30 bg-[#1a1d30]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <Menu className="w-7 h-7 text-white" />
      </button>

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
        <div className="flex flex-col bg-dark/90 glass-effect backdrop-blur-sm shadow-xl border border-primary/20 overflow-hidden">
          {/* User Info */}
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium text-white truncate">{user.username}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="space-y-1 p-2 pt-3 pb-2">
            {NAV_ITEMS.map((item) => (
              <div key={item.href} onClick={(e) => handleNavItemClick(item.href, e)}>
                {item.href !== '/logout' ? (
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
                  <div
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors relative group cursor-pointer text-white hover:text-primary"
                  >
                    <span className="flex items-center justify-center mr-3 text-primary">
                      {item.icon}
                    </span>
                    <span className="transition-opacity">
                      {item.label}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}