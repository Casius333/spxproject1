import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Database,
  Settings,
  CreditCard,
  BarChart3,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Coins,
  Gamepad2
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { 
    label: 'Dashboard', 
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  { 
    label: 'Games', 
    href: '/admin/games',
    icon: <Gamepad2 className="w-5 h-5" />
  },
  { 
    label: 'Users', 
    href: '/admin/users',
    icon: <Users className="w-5 h-5" />
  },
  { 
    label: 'Transactions', 
    href: '/admin/transactions',
    icon: <CreditCard className="w-5 h-5" />
  },
  { 
    label: 'Balance Management', 
    href: '/admin/balance',
    icon: <Coins className="w-5 h-5" />
  },
  { 
    label: 'Statistics', 
    href: '/admin/statistics',
    icon: <BarChart3 className="w-5 h-5" />
  },
  { 
    label: 'Database', 
    href: '/admin/database',
    icon: <Database className="w-5 h-5" />
  },
  { 
    label: 'Settings', 
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />
  },
];

type AdminPageProps = {
  children?: React.ReactNode;
  title: string;
};

export function AdminLayout({ children, title }: AdminPageProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine if an item is active
  const isActiveLink = (href: string) => {
    if (href === '/admin' && location === '/admin') {
      return true;
    }
    return href !== '/admin' && location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-primary/20 transform transition-transform duration-200 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-primary/20">
          <Link href="/admin">
            <a className="flex items-center">
              <LayoutDashboard className="h-6 w-6 text-primary mr-2" />
              <span className="font-heading font-bold text-xl">Admin Panel</span>
            </a>
          </Link>
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex flex-col h-[calc(100%-4rem)] overflow-y-auto py-4">
          <nav className="flex-1 px-2 space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors relative group",
                    isActiveLink(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-gray-300 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <span className="mr-3 text-primary/80">{item.icon}</span>
                  {item.label}
                  {isActiveLink(item.href) && (
                    <span className="absolute inset-y-0 left-0 w-1 bg-primary rounded-tr-md rounded-br-md" />
                  )}
                </a>
              </Link>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="px-2 mt-auto">
            <div className="space-y-1">
              <Link href="/admin/help">
                <a className="flex items-center px-3 py-3 text-sm font-medium rounded-md text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors">
                  <HelpCircle className="mr-3 h-5 w-5 text-primary/80" />
                  Help &amp; Support
                </a>
              </Link>
              <Link href="/">
                <a className="flex items-center px-3 py-3 text-sm font-medium rounded-md text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors">
                  <LogOut className="mr-3 h-5 w-5 text-primary/80" />
                  Back to Casino
                </a>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("md:pl-64 flex flex-col min-h-screen")}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-primary/20 bg-dark px-4 shadow-sm">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-400" />
            <span className="sr-only">Open sidebar</span>
          </button>

          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-x-4">
              <div className="hidden md:block text-sm text-gray-400">
                Admin User
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard">
      <div className="rounded-lg border border-primary/20 bg-dark-card shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to the Admin Dashboard</h2>
        <p className="text-gray-400 mb-6">Manage your casino application from this central dashboard.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Summary Cards */}
          <div className="bg-dark p-4 rounded-lg border border-primary/20 shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-400">Total Users</h3>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">1,234</p>
          </div>
          
          <div className="bg-dark p-4 rounded-lg border border-primary/20 shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-400">Total Games</h3>
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">56</p>
          </div>
          
          <div className="bg-dark p-4 rounded-lg border border-primary/20 shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-400">Transactions</h3>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">4,321</p>
          </div>
          
          <div className="bg-dark p-4 rounded-lg border border-primary/20 shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-400">Revenue</h3>
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">$12,345</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/games">
              <a className="bg-primary/10 hover:bg-primary/20 text-primary p-4 rounded-lg transition-colors flex items-center">
                <Gamepad2 className="h-5 w-5 mr-3" />
                Manage Games
              </a>
            </Link>
            <Link href="/admin/users">
              <a className="bg-primary/10 hover:bg-primary/20 text-primary p-4 rounded-lg transition-colors flex items-center">
                <Users className="h-5 w-5 mr-3" />
                Manage Users
              </a>
            </Link>
            <Link href="/admin/transactions">
              <a className="bg-primary/10 hover:bg-primary/20 text-primary p-4 rounded-lg transition-colors flex items-center">
                <CreditCard className="h-5 w-5 mr-3" />
                View Transactions
              </a>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}