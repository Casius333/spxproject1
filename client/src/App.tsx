import { useState, createContext, useContext } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BalanceProvider } from "@/contexts/balance-context";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/ui/header";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthModal from "@/components/auth-modal";
import Home from "@/pages/home";
import Game from "@/pages/game";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin";
import AdminGames from "@/pages/admin/games";
import AdminUsers from "@/pages/admin/users";

// Auth modal context
interface AuthModalContextType {
  openAuthModal: (defaultTab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

export const AuthModalContext = createContext<AuthModalContextType>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isAuthModalOpen: false,
});

export const useAuthModal = () => useContext(AuthModalContext);

// Main application routes
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:id" component={Game} />
      <Route path="/category/:slug" component={Home} />
      <Route path="/jackpots" component={Home} />
      <Route path="/popular" component={Home} />
      <Route path="/new-games" component={Home} />
      <Route path="/featured" component={Home} />
      <Route path="/premium" component={Home} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/games" component={AdminGames} />
      <Route path="/admin/users" component={AdminUsers} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main casino layout (not used for admin pages)
function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // If we're on an admin page, don't show the main layout
  if (location.startsWith('/admin')) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto pt-4 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (defaultTab: 'login' | 'register' = 'login') => {
    setAuthModalTab(defaultTab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthModalContext.Provider value={{ 
          openAuthModal, 
          closeAuthModal, 
          isAuthModalOpen 
        }}>
          <BalanceProvider initialBalance={1250}>
            <MainLayout>
              <Router />
            </MainLayout>
            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={closeAuthModal} 
              defaultTab={authModalTab} 
            />
            <Toaster />
          </BalanceProvider>
        </AuthModalContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
