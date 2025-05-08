import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight, Home, Wallet, User, LogOut, MenuSquare } from "lucide-react";

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
  const [location] = useLocation();
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

  return (
    <>
      {/* Background Overlay - shown when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Toggle Button */}
      <button
        className="fixed bottom-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg animate-neon-glow"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MenuSquare className="w-6 h-6 text-white" />
      </button>

      {/* Floating Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-4 z-30 flex flex-col transition-all duration-300 rounded-lg overflow-hidden w-60",
          isOpen 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 -translate-x-full pointer-events-none",
          className
        )}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col bg-dark/90 glass-effect backdrop-blur-sm shadow-xl border border-primary/20 overflow-hidden">
          {/* Navigation Links */}
          <nav className="space-y-1 p-2 pt-3 pb-2">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
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
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}