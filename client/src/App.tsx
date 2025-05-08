import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BalanceProvider } from "@/contexts/balance-context";
import { Header } from "@/components/ui/header";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import Home from "@/pages/home";
import Game from "@/pages/game";
import NotFound from "@/pages/not-found";

// Additional routes for the sidebar navigation
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
      <Route path="/admin" component={() => <div>Admin Dashboard (Coming soon)</div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
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
      <BalanceProvider initialBalance={1250}>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </BalanceProvider>
    </QueryClientProvider>
  );
}

export default App;
