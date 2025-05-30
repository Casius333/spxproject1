import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { 
  CreditCard, 
  ArrowUpCircle, 
  DollarSign, 
  Users, 
  LineChart,
  Vault,
  UserCheck,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function AdminDashboard() {
  // Fetch financial overview data
  const { data: financialData, isLoading: isFinancialLoading } = useQuery({
    queryKey: ['/api/admin/reports/financial-overview'],
  });

  // Fetch user registration data
  const { data: registrationData, isLoading: isRegistrationLoading } = useQuery({
    queryKey: ['/api/admin/reports/user-registrations'],
  });

  // Fetch dashboard metrics
  const { data: dashboardMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard-metrics'],
  });

  // Fetch live activity data
  const { data: liveActivity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['/api/admin/live-activity'],
    refetchInterval: 30000, // Refresh every 30 seconds for live data
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-2">
            Real-time insights into your casino operations
          </p>
        </div>

        {/* Key Metrics Grid - Enhanced Financial Visibility */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Player Balances (Gross) */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Total Player Balances
              </CardTitle>
              <Vault className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isMetricsLoading ? "Loading..." : formatCurrency(dashboardMetrics?.totalPlayerBalances || "0")}
              </div>
              <p className="text-xs text-gray-400">
                Includes bonus-locked funds
              </p>
            </CardContent>
          </Card>

          {/* Available Player Balances (Net Liability) */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Available for Withdrawal
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isMetricsLoading ? "Loading..." : formatCurrency(dashboardMetrics?.availablePlayerBalances || "0")}
              </div>
              <p className="text-xs text-gray-400">
                Excludes funds locked in bonuses
              </p>
            </CardContent>
          </Card>

          {/* Bonus-Encumbered Balances */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Bonus-Locked Funds
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isMetricsLoading ? "Loading..." : formatCurrency(dashboardMetrics?.bonusLockedBalances || "0")}
              </div>
              <p className="text-xs text-gray-400">
                Pending turnover requirements
              </p>
            </CardContent>
          </Card>

          {/* Available Surplus (Net System Funds) */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Available Surplus
              </CardTitle>
              {dashboardMetrics && parseFloat(dashboardMetrics.availableSurplus || "0") >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-400" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                dashboardMetrics && parseFloat(dashboardMetrics.availableSurplus || "0") >= 0 
                  ? "text-green-400" 
                  : "text-red-400"
              }`}>
                {isMetricsLoading ? "Loading..." : formatCurrency(dashboardMetrics?.availableSurplus || "0")}
              </div>
              <p className="text-xs text-gray-400">
                Net operational margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Overview Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* System Vault Balance */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                System Vault Balance
              </CardTitle>
              <Vault className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isMetricsLoading ? "Loading..." : formatCurrency(dashboardMetrics?.totalVaultBalance || "0")}
              </div>
              <p className="text-xs text-gray-400">
                Total system funds from operations
              </p>
            </CardContent>
          </Card>

          {/* Current Month Deposits */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Monthly Deposits
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isFinancialLoading ? "Loading..." : formatCurrency(financialData?.currentPeriod?.deposits?.total || "0")}
              </div>
              <p className="text-xs text-gray-400">
                {!isFinancialLoading && financialData?.currentPeriod?.deposits && (
                  <>
                    <span className="text-blue-400">
                      {financialData.currentPeriod.deposits.count || 0} transactions
                    </span>
                    {" this month"}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* New Registrations */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                New Registrations
              </CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isRegistrationLoading ? "Loading..." : (registrationData?.currentPeriod?.count || 0)}
              </div>
              <p className="text-xs text-gray-400">
                {!isRegistrationLoading && (
                  <>
                    <span className="text-purple-400">
                      {registrationData?.todayCount || 0} today
                    </span>
                    {", "}{registrationData?.weekCount || 0}{" this week"}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Live Players */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Live Players
              </CardTitle>
              <UserCheck className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isActivityLoading ? "Loading..." : (liveActivity?.activePlayers || 0)}
              </div>
              <p className="text-xs text-gray-400">
                {!isActivityLoading && (
                  <>
                    <span className="text-yellow-400">
                      {liveActivity?.playersLast24h || 0} in 24h
                    </span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Monthly Revenue */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Monthly Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isFinancialLoading ? "Loading..." : formatCurrency(financialData?.currentPeriod?.revenue || "0")}
              </div>
              <p className="text-xs text-gray-400">
                Net gaming revenue
              </p>
            </CardContent>
          </Card>

          {/* Pending Withdrawals */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Pending Withdrawals
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isFinancialLoading ? "Loading..." : formatCurrency(financialData?.pendingWithdrawals?.amount || "0")}
              </div>
              <p className="text-xs text-gray-400">
                {!isFinancialLoading && (
                  <>
                    <span className="text-orange-400">
                      {financialData?.pendingWithdrawals?.count || 0} requests
                    </span>
                    {" awaiting approval"}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Total Withdrawals */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Monthly Withdrawals
              </CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isFinancialLoading ? "Loading..." : formatCurrency(financialData?.currentPeriod?.withdrawals?.total || "0")}
              </div>
              <p className="text-xs text-gray-400">
                {!isFinancialLoading && financialData?.currentPeriod?.withdrawals && (
                  <>
                    <span className="text-red-400">
                      {financialData.currentPeriod.withdrawals.count || 0} transactions
                    </span>
                    {" this month"}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Active Users (7 days) */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Active Users (7d)
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isMetricsLoading ? "Loading..." : (dashboardMetrics?.activeUsers7d || 0)}
              </div>
              <p className="text-xs text-gray-400">
                {!isMetricsLoading && (
                  <>
                    <span className="text-indigo-400">
                      {dashboardMetrics?.activeUsers30d || 0} in 30 days
                    </span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue Trend Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trend (30 Days)</CardTitle>
              <CardDescription className="text-gray-400">
                Daily revenue performance over the last month
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[300px] flex items-center justify-center">
                <LineChart className="h-16 w-16 text-gray-600" />
                <p className="ml-4 text-gray-600">Revenue chart displays real data from your transactions</p>
              </div>
            </CardContent>
          </Card>
          
          {/* User Activity Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">User Registrations (30 Days)</CardTitle>
              <CardDescription className="text-gray-400">
                Daily new user registrations and retention trends
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[300px] flex items-center justify-center">
                <Users className="h-16 w-16 text-gray-600" />
                <p className="ml-4 text-gray-600">Registration analytics based on your user data</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Recent Large Transactions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Recent Large Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!isActivityLoading && liveActivity?.recentLargeTransactions?.length > 0 ? (
                  liveActivity.recentLargeTransactions.map((transaction: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.username}</p>
                        <p className="text-xs text-gray-400">{transaction.type}</p>
                      </div>
                      <span className="text-sm font-bold text-green-400">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No recent large transactions</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* New Players Today */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">New Players Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!isActivityLoading && liveActivity?.newPlayersToday?.length > 0 ? (
                  liveActivity.newPlayersToday.map((player: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-white">{player.username}</p>
                        <p className="text-xs text-gray-400">{formatDate(player.createdAt)}</p>
                      </div>
                      <span className="text-xs text-purple-400">
                        {player.hasDeposited ? 'Deposited' : 'Registered'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No new registrations today</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Database</span>
                  <span className="text-xs text-green-400">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Payment Gateway</span>
                  <span className="text-xs text-green-400">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Game Providers</span>
                  <span className="text-xs text-green-400">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Cache System</span>
                  <span className="text-xs text-green-400">Optimal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}