import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight, Dice6, Home, Gem, Flame, Star, Zap, Settings, Trophy, MenuSquare } from "lucide-react";

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
  { label: "All Slots", href: "/category/all-slots", icon: <Dice6 className="w-5 h-5" /> },
  { label: "Jackpots", href: "/jackpots", icon: <Trophy className="w-5 h-5" /> },
  { label: "Popular", href: "/popular", icon: <Flame className="w-5 h-5" /> },
  { label: "New Games", href: "/new-games", icon: <Zap className="w-5 h-5" /> },
  { label: "Featured", href: "/featured", icon: <Star className="w-5 h-5" /> },
  { label: "Premium", href: "/premium", icon: <Gem className="w-5 h-5" /> },
];

export function SidebarNav({ className }: SidebarNavProps) {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Close mobile sidebar when location changes
    setIsMobileOpen(false);
  }, [location]);

  // Determine if an item is active
  const isActiveLink = (href: string) => {
    return location === href || 
      (href !== "/" && location.startsWith(href));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Mobile Toggle Button */}
      <button
        className="fixed bottom-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg md:hidden animate-neon-glow"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <MenuSquare className="w-6 h-6 text-white" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 bottom-0 z-30 flex flex-col transition-all duration-300 rounded-tr-lg rounded-br-lg overflow-hidden",
          isMobile
            ? isMobileOpen
              ? "left-0 w-64"
              : "-left-72 w-72"
            : isCollapsed
              ? "w-16 left-4"
              : "w-60 left-4",
          className
        )}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col h-full overflow-y-auto bg-dark/90 glass-effect backdrop-blur-sm shadow-xl border border-primary/20">
          {/* Navigation Links */}
          <nav className="space-y-1 p-2 py-4">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors relative group cursor-pointer",
                    isActiveLink(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-white hover:text-primary"
                  )}
                >
                  <span className="flex items-center justify-center mr-3 text-primary">
                    {item.icon}
                  </span>
                  <span className={cn("transition-opacity", 
                    isCollapsed && !isMobile && !isMobileOpen ? "opacity-0 w-0 hidden" : "opacity-100"
                  )}>
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

          {/* Collapse toggle button (desktop only) */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute top-3 right-3 w-8 h-8 rounded-md bg-dark-card text-primary border border-primary/30 flex items-center justify-center shadow-md hover:bg-primary/10 transition-colors"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>
      </aside>

      {/* Empty spacing for content layout */}
      {!isMobile && (
        <div className={cn(
          "transition-all duration-300", 
          isCollapsed ? "ml-24" : "ml-68"
        )}></div>
      )}
    </>
  );
}