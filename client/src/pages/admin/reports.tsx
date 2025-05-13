import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  CalendarIcon, 
  Download,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  ArrowUpFromLine,
  ArrowDownToLine,
  CircleDollarSign,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AdminLayout } from "@/components/admin/admin-layout";
import { cn } from "@/lib/utils";

// Mock data for reports - would be fetched from API in real implementation
const financialOverviewData = {
  periods: {
    "7d": {
      deposits: { total: "42150.00", count: 95 },
      withdrawals: { total: "32450.00", count: 48 },
      bets: { total: "120350.00", count: 1879 },
      wins: { total: "104790.00", count: 450 },
      ggr: "15560.00"
    },
    "30d": {
      deposits: { total: "187250.00", count: 420 },
      withdrawals: { total: "134820.00", count: 210 },
      bets: { total: "523450.00", count: 8721 },
      wins: { total: "463290.00", count: 2145 },
      ggr: "60160.00"
    },
    "90d": {
      deposits: { total: "564300.00", count: 1250 },
      withdrawals: { total: "392400.00", count: 624 },
      bets: { total: "1560780.00", count: 26542 },
      wins: { total: "1364520.00", count: 6458 },
      ggr: "196260.00"
    }
  }
};

const userActivityData = {
  periods: {
    "7d": {
      newRegistrations: 58,
      activeUsers: 175,
      avgSessionTime: 24.5, // minutes
      avgBetSize: 35.75,
      totalSessions: 542
    },
    "30d": {
      newRegistrations: 210,
      activeUsers: 680,
      avgSessionTime: 22.8, // minutes
      avgBetSize: 32.45,
      totalSessions: 2260
    },
    "90d": {
      newRegistrations: 640,
      activeUsers: 1450,
      avgSessionTime: 23.2, // minutes
      avgBetSize: 33.20,
      totalSessions: 6845
    }
  }
};

const gamePerformanceData = {
  periods: {
    "7d": [
      { name: "Lucky Dragon", plays: 765, ggr: 4250.25, rtp: 96.2 },
      { name: "Gold Rush", plays: 680, ggr: 3850.50, rtp: 94.8 },
      { name: "Space Adventure", plays: 590, ggr: 3120.75, rtp: 95.7 },
      { name: "Tropical Paradise", plays: 520, ggr: 2760.40, rtp: 96.0 },
      { name: "Ancient Treasures", plays: 480, ggr: 2540.60, rtp: 93.5 }
    ],
    "30d": [
      { name: "Lucky Dragon", plays: 3120, ggr: 17850.75, rtp: 96.1 },
      { name: "Gold Rush", plays: 2950, ggr: 16480.50, rtp: 94.9 },
      { name: "Space Adventure", plays: 2480, ggr: 13250.25, rtp: 95.6 },
      { name: "Tropical Paradise", plays: 2150, ggr: 11680.40, rtp: 95.9 },
      { name: "Ancient Treasures", plays: 1980, ggr: 10560.30, rtp: 93.8 }
    ],
    "90d": [
      { name: "Lucky Dragon", plays: 9450, ggr: 52650.75, rtp: 96.0 },
      { name: "Gold Rush", plays: 8720, ggr: 48350.50, rtp: 94.5 },
      { name: "Space Adventure", plays: 7640, ggr: 41280.25, rtp: 95.5 },
      { name: "Tropical Paradise", plays: 6840, ggr: 36480.40, rtp: 95.8 },
      { name: "Ancient Treasures", plays: 6120, ggr: 32450.30, rtp: 93.5 }
    ]
  }
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("financial");
  const [financialDateRange, setFinancialDateRange] = useState<Date | undefined>(new Date());
  const [timePeriod, setTimePeriod] = useState("30d");

  // In a real implementation, we would fetch this data from the API
  const { data: financialData, isLoading: isFinancialLoading } = useQuery({
    queryKey: ['/api/admin/reports/financial-overview', timePeriod],
    queryFn: () => Promise.resolve(financialOverviewData.periods[timePeriod as keyof typeof financialOverviewData.periods]),
  });

  const { data: activityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['/api/admin/reports/user-activity', timePeriod],
    queryFn: () => Promise.resolve(userActivityData.periods[timePeriod as keyof typeof userActivityData.periods]),
  });

  const { data: gameData, isLoading: isGameLoading } = useQuery({
    queryKey: ['/api/admin/reports/game-performance', timePeriod],
    queryFn: () => Promise.resolve(gamePerformanceData.periods[timePeriod as keyof typeof gamePerformanceData.periods]),
  });

  // Format currency
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(value));
  };

  // Calculate the percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center">
              <Select
                value={timePeriod}
                onValueChange={setTimePeriod}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              
              <span className="px-2 text-gray-500">or</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[190px] justify-start text-left font-normal",
                      !financialDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {financialDateRange ? format(financialDateRange, "PPP") : <span>Custom Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={financialDateRange}
                    onSelect={setFinancialDateRange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="financial" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="user-activity">User Activity</TabsTrigger>
            <TabsTrigger value="game-performance">Game Performance</TabsTrigger>
          </TabsList>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Deposits Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Deposits
                  </CardTitle>
                  <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isFinancialLoading && formatCurrency(financialData?.deposits.total || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!isFinancialLoading && `${financialData?.deposits.count || 0} transactions`}
                  </p>
                </CardContent>
              </Card>

              {/* Withdrawals Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Withdrawals
                  </CardTitle>
                  <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isFinancialLoading && formatCurrency(financialData?.withdrawals.total || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!isFinancialLoading && `${financialData?.withdrawals.count || 0} transactions`}
                  </p>
                </CardContent>
              </Card>

              {/* Bets Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Bets
                  </CardTitle>
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isFinancialLoading && formatCurrency(financialData?.bets.total || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!isFinancialLoading && `${financialData?.bets.count || 0} transactions`}
                  </p>
                </CardContent>
              </Card>

              {/* GGR Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gross Gaming Revenue
                  </CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isFinancialLoading && formatCurrency(financialData?.ggr || "0")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!isFinancialLoading && `Net from ${financialData?.bets.count || 0} bets`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Financial Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Deposits, withdrawals, bets, and GGR over time
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[400px] flex items-center justify-center">
                  <AreaChart className="h-16 w-16 text-gray-400" />
                  <p className="ml-4 text-gray-400">Revenue chart would display here in a real implementation</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="user-activity" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* New Registrations Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    New Registrations
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isActivityLoading && activityData?.newRegistrations || 0}
                  </div>
                </CardContent>
              </Card>

              {/* Active Users Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isActivityLoading && activityData?.activeUsers || 0}
                  </div>
                </CardContent>
              </Card>

              {/* Average Session Time Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Session Time
                  </CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isActivityLoading && `${activityData?.avgSessionTime || 0} min`}
                  </div>
                </CardContent>
              </Card>

              {/* Average Bet Size Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Bet Size
                  </CardTitle>
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {!isActivityLoading && formatCurrency(activityData?.avgBetSize.toString() || "0")}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Activity Charts */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Registrations</CardTitle>
                  <CardDescription>
                    New user registrations over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[350px] flex items-center justify-center">
                    <BarChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-4 text-gray-400">Registration chart would display here in a real implementation</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>
                    Daily active users and session times
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[350px] flex items-center justify-center">
                    <LineChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-4 text-gray-400">Activity chart would display here in a real implementation</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Game Performance Tab */}
          <TabsContent value="game-performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Games</CardTitle>
                <CardDescription>
                  Games with the highest number of plays and GGR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left pb-3 font-medium">Game Name</th>
                        <th className="text-left pb-3 font-medium">Plays</th>
                        <th className="text-left pb-3 font-medium">GGR</th>
                        <th className="text-left pb-3 font-medium">RTP %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!isGameLoading && gameData && gameData.length > 0 ? (
                        gameData.map((game, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-800">
                            <td className="py-3">{game.name}</td>
                            <td className="py-3">{game.plays.toLocaleString()}</td>
                            <td className="py-3">{formatCurrency(game.ggr.toString())}</td>
                            <td className="py-3">{game.rtp.toFixed(1)}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-3 text-center">
                            {isGameLoading ? "Loading..." : "No game data available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Game Performance Charts */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Game Popularity</CardTitle>
                  <CardDescription>
                    Distribution of game plays across top games
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[350px] flex items-center justify-center">
                    <PieChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-4 text-gray-400">Popularity chart would display here in a real implementation</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Game Revenue</CardTitle>
                  <CardDescription>
                    GGR by game over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[350px] flex items-center justify-center">
                    <BarChart className="h-16 w-16 text-gray-400" />
                    <p className="ml-4 text-gray-400">Revenue chart would display here in a real implementation</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}