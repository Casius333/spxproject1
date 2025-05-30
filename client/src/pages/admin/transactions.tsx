import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/admin-layout';
import { 
  CreditCard, 
  ArrowUpCircle, 
  Search,
  Filter,
  Download,
  Calendar
} from 'lucide-react';

export default function AdminTransactions() {
  const [activeTab, setActiveTab] = useState('deposits');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [paymentMethod, setPaymentMethod] = useState('all_methods');
  const [statusFilter, setStatusFilter] = useState('all_statuses');

  // Fetch deposits data
  const { data: depositsData, isLoading: isDepositsLoading } = useQuery({
    queryKey: ['/api/admin/transactions/deposits', { search: searchTerm, dateRange, paymentMethod, status: statusFilter }],
  });

  // Fetch withdrawals data
  const { data: withdrawalsData, isLoading: isWithdrawalsLoading } = useQuery({
    queryKey: ['/api/admin/transactions/withdrawals', { search: searchTerm, dateRange, paymentMethod, status: statusFilter }],
  });

  // Fetch transaction analytics
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/admin/transactions/analytics', { dateRange }],
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      failed: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs ${statusColors[status as keyof typeof statusColors] || statusColors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <p className="text-gray-400 mt-2">
              Monitor and manage all financial transactions
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Total Volume ({dateRange})
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isAnalyticsLoading ? "Loading..." : formatCurrency(analyticsData?.totalVolume || "0")}
              </div>
              <p className="text-xs text-gray-400">
                {!isAnalyticsLoading && (
                  <>
                    <span className="text-blue-400">
                      {analyticsData?.totalTransactions || 0} transactions
                    </span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Avg Transaction Size
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isAnalyticsLoading ? "Loading..." : formatCurrency(analyticsData?.avgTransactionSize || "0")}
              </div>
              <p className="text-xs text-gray-400">
                Cross all payment methods
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Success Rate
              </CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isAnalyticsLoading ? "Loading..." : `${analyticsData?.successRate || 0}%`}
              </div>
              <p className="text-xs text-gray-400">
                {!isAnalyticsLoading && (
                  <>
                    <span className="text-purple-400">
                      {analyticsData?.failedTransactions || 0} failed
                    </span>
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Pending Review
              </CardTitle>
              <Calendar className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isAnalyticsLoading ? "Loading..." : (analyticsData?.pendingReview || 0)}
              </div>
              <p className="text-xs text-gray-400">
                Transactions awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by player, transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="1d">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all_methods">All Methods</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="e_wallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all_statuses">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="deposits" className="data-[state=active]:bg-blue-600">
              Deposits
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-blue-600">
              Withdrawals
            </TabsTrigger>
          </TabsList>

          {/* Deposits Tab */}
          <TabsContent value="deposits">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Deposit Transactions</CardTitle>
                <CardDescription className="text-gray-400">
                  All deposit transactions with filtering and search capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left pb-3 font-medium text-gray-300">Transaction ID</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Player</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Amount</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Method</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Status</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Date</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isDepositsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            Loading transactions...
                          </td>
                        </tr>
                      ) : depositsData?.transactions?.length > 0 ? (
                        depositsData.transactions.map((deposit: any) => (
                          <tr key={deposit.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="py-3 font-mono text-sm text-gray-300">#{deposit.id}</td>
                            <td className="py-3 text-white">{deposit.username}</td>
                            <td className="py-3 font-semibold text-green-400">{formatCurrency(deposit.amount)}</td>
                            <td className="py-3 text-gray-300 capitalize">{deposit.method?.replace('_', ' ')}</td>
                            <td className="py-3">{getStatusBadge(deposit.status)}</td>
                            <td className="py-3 text-gray-400">{formatDate(deposit.createdAt)}</td>
                            <td className="py-3">
                              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No deposit transactions found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Withdrawal Transactions</CardTitle>
                <CardDescription className="text-gray-400">
                  All withdrawal requests and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left pb-3 font-medium text-gray-300">Transaction ID</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Player</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Amount</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Method</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Status</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Date</th>
                        <th className="text-left pb-3 font-medium text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isWithdrawalsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            Loading transactions...
                          </td>
                        </tr>
                      ) : withdrawalsData?.transactions?.length > 0 ? (
                        withdrawalsData.transactions.map((withdrawal: any) => (
                          <tr key={withdrawal.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="py-3 font-mono text-sm text-gray-300">#{withdrawal.id}</td>
                            <td className="py-3 text-white">{withdrawal.username}</td>
                            <td className="py-3 font-semibold text-red-400">{formatCurrency(withdrawal.amount)}</td>
                            <td className="py-3 text-gray-300 capitalize">{withdrawal.method?.replace('_', ' ')}</td>
                            <td className="py-3">{getStatusBadge(withdrawal.status)}</td>
                            <td className="py-3 text-gray-400">{formatDate(withdrawal.createdAt)}</td>
                            <td className="py-3">
                              <div className="flex gap-2">
                                {withdrawal.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                      Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/10">
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                  View Details
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No withdrawal transactions found matching your criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}