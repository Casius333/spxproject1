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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Ban,
  CircleDollarSign
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useToast } from "@/hooks/use-toast";



export default function PlayersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all_statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch actual player data from the API
  const { data: playersData, isLoading } = useQuery({
    queryKey: ['/api/admin/players', statusFilter, currentPage, searchQuery],
  });

  const players = playersData?.players || [];

  // Filter players based on search query and status
  const filteredPlayers = players ? players.filter(player => {
    const matchesSearch = 
      searchQuery === "" || 
      player.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all_statuses" || 
      player.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handle status change (would send API request in real implementation)
  const handleStatusChange = (playerId: number, newStatus: string) => {
    toast({
      title: "Status updated",
      description: `Player #${playerId} status changed to ${newStatus}`,
    });
  };

  // Handle balance adjustment (would send API request in real implementation)
  const handleBalanceAdjustment = (playerId: number, amount: number, operation: 'add' | 'subtract') => {
    toast({
      title: "Balance adjusted",
      description: `${operation === 'add' ? 'Added' : 'Subtracted'} ${formatCurrency(amount)} ${operation === 'add' ? 'to' : 'from'} player #${playerId}`,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Player Management</h2>
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by username or email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_statuses">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Players table */}
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
            <CardDescription>
              Manage player accounts, view activity, and adjust balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Total Deposits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>{player.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{player.username}</div>
                          <div className="text-sm text-gray-500">{player.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(player.createdAt)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatCurrency(player.balance)}</TableCell>
                      <TableCell>{formatCurrency(player.totalDeposits)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            player.status === "active" 
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/25" 
                              : player.status === "suspended" 
                              ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/25" 
                              : "bg-red-500/20 text-red-400 hover:bg-red-500/25"
                          }
                        >
                          {player.status ? player.status.charAt(0).toUpperCase() + player.status.slice(1) : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => handleBalanceAdjustment(player.id, 100, 'add')}
                            >
                              <CircleDollarSign className="mr-2 h-4 w-4" /> 
                              Add Credit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleBalanceAdjustment(player.id, 100, 'subtract')}
                              disabled={player.balance <= 0}
                            >
                              <CircleDollarSign className="mr-2 h-4 w-4" /> 
                              Remove Credit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {player.status === "active" ? (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(player.id, "suspended")}
                                className="text-amber-500"
                              >
                                <Ban className="mr-2 h-4 w-4" /> 
                                Suspend Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(player.id, "active")}
                                className="text-green-500"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" /> 
                                Reactivate Account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(player.id, "banned")}
                              className="text-red-500"
                            >
                              <Ban className="mr-2 h-4 w-4" /> 
                              Ban Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      {isLoading ? "Loading..." : "No players found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-gray-500">
                Page {currentPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={filteredPlayers.length < itemsPerPage}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}