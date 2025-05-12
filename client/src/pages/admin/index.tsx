import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  CreditCard, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users,
  Calendar,
  LineChart,
  BarChart,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdmin } from "@/contexts/admin-context";

// Mock data for charts - this would come from API in a real implementation
const financialOverviewData = {
  currentMonth: {
    deposits: { total: "187250.00", count: 420 },
    withdrawals: { total: "134820.00", count: 210 },
    bets: { total: "523450.00", count: 8721 },
    wins: { total: "463290.00", count: 2145 },
    ggr: "60160.00"
  },
  previousMonth: {
    deposits: { total: "165430.00", count: 380 },
    withdrawals: { total: "110560.00", count: 175 },
    bets: { total: "490870.00", count: 7930 },
    wins: { total: "432150.00", count: 1950 },
    ggr: "58720.00"
  }
};

const userRegistrationData = {
  currentMonth: { count: 210 },
  previousMonth: { count: 175 },
  dailyData: [
    { date: "2025-05-01", count: 12 },
    { date: "2025-05-02", count: 8 },
    { date: "2025-05-03", count: 15 },
    { date: "2025-05-04", count: 10 },
    { date: "2025-05-05", count: 9 },
    { date: "2025-05-06", count: 11 },
    { date: "2025-05-07", count: 7 }
  ]
};

const recentDeposits = [
  { id: 1, username: "user123", amount: "250.00", method: "credit_card", date: "2025-05-12T08:30:00Z" },
  { id: 2, username: "gambler777", amount: "1000.00", method: "crypto", date: "2025-05-12T07:15:00Z" },
  { id: 3, username: "slotFan22", amount: "500.00", method: "bank_transfer", date: "2025-05-11T23:45:00Z" },
  { id: 4, username: "luckySpin", amount: "150.00", method: "credit_card", date: "2025-05-11T22:10:00Z" },
  { id: 5, username: "highRoller", amount: "2000.00", method: "crypto", date: "2025-05-11T21:30:00Z" }
];

const recentWithdrawals = [
  { id: 1, username: "bigWinner", amount: "850.00", method: "bank_transfer", status: "completed", date: "2025-05-12T09:20:00Z" },
  { id: 2, username: "slotKing", amount: "1200.00", method: "crypto", status: "pending", date: "2025-05-12T08:45:00Z" },
  { id: 3, username: "luckyGuy", amount: "500.00", method: "bank_transfer", status: "completed", date: "2025-05-11T22:30:00Z" },
  { id: 4, username: "gambler777", amount: "300.00", method: "crypto", status: "completed", date: "2025-05-11T20:15:00Z" },
  { id: 5, username: "spinMaster", amount: "725.00", method: "bank_transfer", status: "pending", date: "2025-05-11T19:40:00Z" }
];

export default function AdminDashboardPage() {
  const { admin } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");

  // In a real implementation, we would fetch this data from the API
  const { data: financialData, isLoading: isFinancialLoading } = useQuery({
    queryKey: ['/api/admin/reports/financial-overview'],
    queryFn: () => Promise.resolve(financialOverviewData),
  });

  const { data: registrationData, isLoading: isRegistrationLoading } = useQuery({
    queryKey: ['/api/admin/reports/user-registrations'],
    queryFn: () => Promise.resolve(userRegistrationData),
  });

  // Calculate the percent change for metrics
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  // Format numbers as currency
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(value));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {admin?.username}</h2>
          <span className="text-sm text-gray-400">
            Last login: {admin?.lastLogin 
              ? new Date(admin.lastLogin).toLocaleString() 
              : 'First login'}
          </span>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="activity">User Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Deposits Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Deposits
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isFinancialLoading && formatCurrency(financialData?.currentMonth.deposits.total || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {!isFinancialLoading && (
                      <>
                        <span className={
                          calculateChange(
                            parseFloat(financialData?.currentMonth.deposits.total || "0"),
                            parseFloat(financialData?.previousMonth.deposits.total || "0")
                          ) >= 0 ? "text-green-500" : "text-red-500"
                        }>
                          {calculateChange(
                            parseFloat(financialData?.currentMonth.deposits.total || "0"),
                            parseFloat(financialData?.previousMonth.deposits.total || "0")
                          ).toFixed(1)}%
                        </span>
                        {" from last month"}
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Withdrawals Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Withdrawals
                  </CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isFinancialLoading && formatCurrency(financialData?.currentMonth.withdrawals.total || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {!isFinancialLoading && (
                      <>
                        <span className={
                          calculateChange(
                            parseFloat(financialData?.currentMonth.withdrawals.total || "0"),
                            parseFloat(financialData?.previousMonth.withdrawals.total || "0")
                          ) <= 0 ? "text-green-500" : "text-red-500"
                        }>
                          {Math.abs(calculateChange(
                            parseFloat(financialData?.currentMonth.withdrawals.total || "0"),
                            parseFloat(financialData?.previousMonth.withdrawals.total || "0")
                          )).toFixed(1)}%
                        </span>
                        {calculateChange(
                          parseFloat(financialData?.currentMonth.withdrawals.total || "0"),
                          parseFloat(financialData?.previousMonth.withdrawals.total || "0")
                        ) <= 0 ? " decrease" : " increase"}
                        {" from last month"}
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* GGR Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gross Gaming Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isFinancialLoading && formatCurrency(financialData?.currentMonth.ggr || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {!isFinancialLoading && (
                      <>
                        <span className={
                          calculateChange(
                            parseFloat(financialData?.currentMonth.ggr || "0"),
                            parseFloat(financialData?.previousMonth.ggr || "0")
                          ) >= 0 ? "text-green-500" : "text-red-500"
                        }>
                          {calculateChange(
                            parseFloat(financialData?.currentMonth.ggr || "0"),
                            parseFloat(financialData?.previousMonth.ggr || "0")
                          ).toFixed(1)}%
                        </span>
                        {" from last month"}
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* New Users Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    New Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isRegistrationLoading && registrationData?.currentMonth.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {!isRegistrationLoading && (
                      <>
                        <span className={
                          calculateChange(
                            registrationData?.currentMonth.count || 0,
                            registrationData?.previousMonth.count || 0
                          ) >= 0 ? "text-green-500" : "text-red-500"
                        }>
                          {calculateChange(
                            registrationData?.currentMonth.count || 0,
                            registrationData?.previousMonth.count || 0
                          ).toFixed(1)}%
                        </span>
                        {" from last month"}
                      </>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>
                    Monthly deposit, withdrawal, and GGR summary
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px] flex items-center justify-center">
                    <LineChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-4 text-gray-400">Revenue chart would display here in a real implementation</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>New User Registrations</CardTitle>
                  <CardDescription>
                    Daily user registration activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px] flex items-center justify-center">
                    <BarChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-4 text-gray-400">Registration chart would display here in a real implementation</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Deposits</CardTitle>
                <CardDescription>
                  Latest user deposits across all payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left pb-3 font-medium">ID</th>
                        <th className="text-left pb-3 font-medium">User</th>
                        <th className="text-left pb-3 font-medium">Amount</th>
                        <th className="text-left pb-3 font-medium">Method</th>
                        <th className="text-left pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDeposits.map((deposit) => (
                        <tr key={deposit.id} className="border-b border-gray-700 hover:bg-gray-800">
                          <td className="py-3">{deposit.id}</td>
                          <td className="py-3">{deposit.username}</td>
                          <td className="py-3">{formatCurrency(deposit.amount)}</td>
                          <td className="py-3 capitalize">{deposit.method.replace('_', ' ')}</td>
                          <td className="py-3">{formatDate(deposit.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Withdrawals</CardTitle>
                <CardDescription>
                  Latest user withdrawal requests and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left pb-3 font-medium">ID</th>
                        <th className="text-left pb-3 font-medium">User</th>
                        <th className="text-left pb-3 font-medium">Amount</th>
                        <th className="text-left pb-3 font-medium">Method</th>
                        <th className="text-left pb-3 font-medium">Status</th>
                        <th className="text-left pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentWithdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="border-b border-gray-700 hover:bg-gray-800">
                          <td className="py-3">{withdrawal.id}</td>
                          <td className="py-3">{withdrawal.username}</td>
                          <td className="py-3">{formatCurrency(withdrawal.amount)}</td>
                          <td className="py-3 capitalize">{withdrawal.method.replace('_', ' ')}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                              withdrawal.status === 'completed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : withdrawal.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3">{formatDate(withdrawal.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>
                  Recent user actions and game activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[200px]">
                  <Calendar className="h-16 w-16 text-gray-400" />
                  <p className="ml-4 text-gray-400">User activity would display here in a real implementation</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}