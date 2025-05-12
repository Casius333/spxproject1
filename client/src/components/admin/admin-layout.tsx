import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Users, 
  BarChart4, 
  Gift, 
  RefreshCw, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, logout } = useAdmin();
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(true);

  const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/reports", icon: BarChart4, label: "Reports" },
    { href: "/admin/players", icon: Users, label: "Players" },
    { href: "/admin/promotions", icon: Gift, label: "Promotions" },
    { href: "/admin/affiliates", icon: RefreshCw, label: "Affiliates" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div
        className={cn(
          "h-full flex flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300",
          expanded ? "w-64" : "w-16"
        )}
      >
        {/* Logo area */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {expanded && (
            <div className="text-xl font-bold">
              LuckyPunt <span className="text-primary">Admin</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-gray-400 hover:text-white"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-4 pb-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link 
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg mx-2",
                          location === item.href && "bg-gray-700 text-white"
                        )}
                      >
                        <item.icon size={20} />
                        {expanded && <span className="ml-4">{item.label}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!expanded && (
                      <TooltipContent side="right">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center">
            <div
              className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium"
            >
              {admin?.username.charAt(0).toUpperCase()}
            </div>
            
            {expanded && (
              <div className="ml-2">
                <div className="text-sm font-medium">{admin?.username}</div>
                <div className="text-xs text-gray-400 capitalize">{admin?.role}</div>
              </div>
            )}
          </div>
          
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-gray-300 hover:text-white",
                    expanded ? "w-full mt-2 justify-start" : "mt-4 p-2"
                  )}
                  onClick={logout}
                >
                  <LogOut size={16} />
                  {expanded && <span className="ml-2">Logout</span>}
                </Button>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-gray-700 bg-gray-800 flex items-center px-6 justify-between">
          <h1 className="text-xl font-semibold">
            {location === "/admin" && "Dashboard"}
            {location === "/admin/reports" && "Reports"}
            {location === "/admin/players" && "Players"}
            {location === "/admin/promotions" && "Promotions"}
            {location === "/admin/affiliates" && "Affiliates"}
            {location === "/admin/settings" && "Settings"}
          </h1>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}