import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Users, Activity, Settings, BookOpen, Home, Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export function AdminLayout({ children, title = 'Dashboard' }: AdminLayoutProps) {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-dark-card">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block w-64 border-r border-primary/20 min-h-screen bg-dark">
          <div className="p-4 border-b border-primary/20">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              <span className="neon-text">Lucky</span>
              <span className="text-accent">Punt</span> Admin
            </h1>
          </div>
          
          <nav className="p-4 space-y-1">
            <Link href="/admin">
              <div className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors cursor-pointer",
                location === "/admin" ? "text-primary bg-primary/10" : "text-gray-300 hover:text-primary"
              )}>
                <Layout className="h-5 w-5 mr-3" />
                Dashboard
              </div>
            </Link>
            
            <Link href="/admin/games">
              <div className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors cursor-pointer",
                location === "/admin/games" ? "text-primary bg-primary/10" : "text-gray-300 hover:text-primary"
              )}>
                <BookOpen className="h-5 w-5 mr-3" />
                Games
              </div>
            </Link>
            
            <Link href="/admin/users">
              <div className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors cursor-pointer",
                location === "/admin/users" ? "text-primary bg-primary/10" : "text-gray-300 hover:text-primary"
              )}>
                <Users className="h-5 w-5 mr-3" />
                Users
              </div>
            </Link>
            
            <Link href="/admin/settings">
              <div className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors cursor-pointer",
                location === "/admin/settings" ? "text-primary bg-primary/10" : "text-gray-300 hover:text-primary"
              )}>
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </div>
            </Link>
            
            <div className="pt-6 border-t border-primary/20 mt-6">
              <Link href="/">
                <div className="flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-primary/10 transition-colors text-gray-300 hover:text-primary cursor-pointer">
                  <Home className="h-5 w-5 mr-3" />
                  Back to Site
                </div>
              </Link>
            </div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <header className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              
              <Link href="/">
                <div className="flex items-center text-gray-400 hover:text-primary cursor-pointer">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span className="text-sm">Back to site</span>
                </div>
              </Link>
            </div>
          </header>
          
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  // Mock stats for demonstration
  const stats = [
    { title: 'Total Users', value: '568', change: '+12%', icon: <Users className="h-6 w-6 text-primary" /> },
    { title: 'Active Games', value: '47', change: '+4%', icon: <BookOpen className="h-6 w-6 text-primary" /> },
    { title: 'Daily Revenue', value: '$5,245', change: '+18%', icon: <Activity className="h-6 w-6 text-primary" /> },
  ];
  
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-dark rounded-lg border border-primary/20 shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <div className="mt-2 flex items-center text-green-500">
                  <span className="text-xs">{stat.change} this week</span>
                </div>
              </div>
              <div className="p-3 bg-dark-card rounded-lg">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-primary/20 bg-dark shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-primary/10">
                  <td className="px-4 py-3 text-sm">player123</td>
                  <td className="px-4 py-3 text-sm"><span className="text-red-400">Bet</span></td>
                  <td className="px-4 py-3 text-sm">$25.00</td>
                  <td className="px-4 py-3 text-sm text-gray-400">Just now</td>
                </tr>
                <tr className="border-b border-primary/10">
                  <td className="px-4 py-3 text-sm">highroller</td>
                  <td className="px-4 py-3 text-sm"><span className="text-green-400">Win</span></td>
                  <td className="px-4 py-3 text-sm">$120.00</td>
                  <td className="px-4 py-3 text-sm text-gray-400">5 mins ago</td>
                </tr>
                <tr className="border-b border-primary/10">
                  <td className="px-4 py-3 text-sm">newuser42</td>
                  <td className="px-4 py-3 text-sm"><span className="text-blue-400">Deposit</span></td>
                  <td className="px-4 py-3 text-sm">$100.00</td>
                  <td className="px-4 py-3 text-sm text-gray-400">15 mins ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="rounded-lg border border-primary/20 bg-dark shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Popular Games</h2>
          <div className="space-y-4">
            <div className="flex items-center p-3 hover:bg-dark-card rounded-lg transition-colors">
              <img src="https://placehold.co/100x100/2a2a2a/purple?text=Game+1" alt="Game" className="w-12 h-12 rounded mr-4" />
              <div className="flex-1">
                <h3 className="font-medium">Lucky Spin</h3>
                <p className="text-sm text-gray-400">2,453 plays this week</p>
              </div>
              <div className="text-right">
                <span className="text-green-400">+18%</span>
              </div>
            </div>
            
            <div className="flex items-center p-3 hover:bg-dark-card rounded-lg transition-colors">
              <img src="https://placehold.co/100x100/2a2a2a/purple?text=Game+2" alt="Game" className="w-12 h-12 rounded mr-4" />
              <div className="flex-1">
                <h3 className="font-medium">Diamond Rush</h3>
                <p className="text-sm text-gray-400">1,872 plays this week</p>
              </div>
              <div className="text-right">
                <span className="text-green-400">+12%</span>
              </div>
            </div>
            
            <div className="flex items-center p-3 hover:bg-dark-card rounded-lg transition-colors">
              <img src="https://placehold.co/100x100/2a2a2a/purple?text=Game+3" alt="Game" className="w-12 h-12 rounded mr-4" />
              <div className="flex-1">
                <h3 className="font-medium">Gold Vault</h3>
                <p className="text-sm text-gray-400">1,245 plays this week</p>
              </div>
              <div className="text-right">
                <span className="text-red-400">-3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}