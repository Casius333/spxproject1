import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BalanceProvider } from "@/contexts/balance-context";
import { WinNotificationProvider } from "@/components/win-notification";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthModalProvider } from "@/contexts/auth-modal-context";
import { ProfileDialogProvider } from "@/contexts/profile-dialog-context";
import { AdminProvider } from "@/contexts/admin-context";
import { Header } from "@/components/ui/header";
import { SidebarNav, SidebarProvider } from "@/components/ui/sidebar-nav";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminProtectedRoute } from "@/lib/admin-protected-route";
import Home from "@/pages/home";
import Game from "@/pages/game";
import ProfilePage from "@/pages/profile";
import TransactionHistoryPage from "@/pages/transaction-history";
import NotFound from "@/pages/not-found";
import AdminLoginPage from "@/pages/admin/login";
import AdminDashboardPage from "@/pages/admin/index";
import PlayersPage from "@/pages/admin/players";
import ReportsPage from "@/pages/admin/reports";
import PromotionsPage from "@/pages/admin/promotions";
import AffiliatesPage from "@/pages/admin/affiliates";
import SettingsPage from "@/pages/admin/settings";

// Main application routes
function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');
  
  return (
    <Switch>
      {/* Regular casino routes - not accessible from admin section */}
      {!isAdminRoute && (
        <>
          <Route path="/" component={Home} />
          <Route path="/game/:id" component={Game} />
          <Route path="/category/:slug" component={Home} />
          <Route path="/jackpots" component={Home} />
          <Route path="/popular" component={Home} />
          <Route path="/new-games" component={Home} />
          <Route path="/featured" component={Home} />
          <Route path="/premium" component={Home} />
          
          {/* Protected user routes */}
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/transaction-history" component={TransactionHistoryPage} />
        </>
      )}
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      
      {/* Admin dashboard and sub-routes */}
      <AdminProtectedRoute path="/admin" component={AdminDashboardPage} />
      <AdminProtectedRoute path="/admin/reports" component={ReportsPage} />
      <AdminProtectedRoute path="/admin/players" component={PlayersPage} />
      <AdminProtectedRoute path="/admin/promotions" component={PromotionsPage} />
      <AdminProtectedRoute path="/admin/affiliates" component={AffiliatesPage} />
      <AdminProtectedRoute path="/admin/settings" component={SettingsPage} />
      
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
        <main className="flex-1 overflow-y-auto pt-4 pb-12">
          {children}
        </main>
        <SidebarNav />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <AuthModalProvider>
            <SidebarProvider>
              <ProfileDialogProvider>
                <BalanceProvider initialBalance={1250}>
                  <WinNotificationProvider>
                    <MainLayout>
                      <Router />
                    </MainLayout>
                    <Toaster />
                  </WinNotificationProvider>
                </BalanceProvider>
              </ProfileDialogProvider>
            </SidebarProvider>
          </AuthModalProvider>
        </AdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
