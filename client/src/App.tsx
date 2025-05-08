import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BalanceProvider } from "@/contexts/balance-context";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/ui/header";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { ProtectedRoute } from "@/lib/protected-route";
import Home from "@/pages/home";
import Game from "@/pages/game";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin";
import AdminGames from "@/pages/admin/games";
import AdminUsers from "@/pages/admin/users";

// Main application routes
function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/game/:id" component={Game} />
      <ProtectedRoute path="/category/:slug" component={Home} />
      <ProtectedRoute path="/jackpots" component={Home} />
      <ProtectedRoute path="/popular" component={Home} />
      <ProtectedRoute path="/new-games" component={Home} />
      <ProtectedRoute path="/featured" component={Home} />
      <ProtectedRoute path="/premium" component={Home} />
      
      {/* Auth route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/games" component={AdminGames} />
      <Route path="/admin/users" component={AdminUsers} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main casino layout (not used for admin pages or auth page)
function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // If we're on an admin page or auth page, don't show the main layout
  if (location.startsWith('/admin') || location === '/auth') {
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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BalanceProvider initialBalance={1250}>
          <MainLayout>
            <Router />
          </MainLayout>
          <Toaster />
        </BalanceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
