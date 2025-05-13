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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Users,
  Calendar,
  CircleDollarSign,
  RefreshCw,
  BarChart4,
  Link,
  Copy,
  Eye,
  FileText,
  UserPlus,
  CheckCircle,
  XCircle
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
import { Textarea } from "@/components/ui/textarea";

// Mock data for affiliates - would be fetched from API in real implementation
const mockAffiliates = [
  {
    id: 1,
    name: "BettingExperts",
    email: "partners@bettingexperts.com",
    website: "https://bettingexperts.com",
    commission: 25,
    status: "active",
    registrationDate: "2025-01-15T12:30:00Z",
    referralCode: "BETEXP25",
    referrals: 142,
    totalDeposits: 48750.00,
    commissionEarned: 12187.50,
    paidCommission: 10000.00,
    pendingCommission: 2187.50
  },
  {
    id: 2,
    name: "CasinoReviewers",
    email: "affiliate@casinoreviewers.net",
    website: "https://casinoreviewers.net",
    commission: 20,
    status: "active",
    registrationDate: "2025-02-10T09:15:00Z",
    referralCode: "CASREV20",
    referrals: 98,
    totalDeposits: 32640.00,
    commissionEarned: 6528.00,
    paidCommission: 5000.00,
    pendingCommission: 1528.00
  },
  {
    id: 3,
    name: "SlotsFinder",
    email: "partners@slotsfinder.com",
    website: "https://slotsfinder.com",
    commission: 30,
    status: "pending",
    registrationDate: "2025-05-05T14:45:00Z",
    referralCode: "SLOTS30",
    referrals: 0,
    totalDeposits: 0,
    commissionEarned: 0,
    paidCommission: 0,
    pendingCommission: 0
  },
  {
    id: 4,
    name: "GamblingPortal",
    email: "affiliates@gamblingportal.org",
    website: "https://gamblingportal.org",
    commission: 22,
    status: "active",
    registrationDate: "2025-03-20T10:30:00Z",
    referralCode: "GAMPORT22",
    referrals: 67,
    totalDeposits: 19850.00,
    commissionEarned: 4367.00,
    paidCommission: 4000.00,
    pendingCommission: 367.00
  },
  {
    id: 5,
    name: "BonusHunter",
    email: "contact@bonushunter.com",
    website: "https://bonushunter.com",
    commission: 18,
    status: "suspended",
    registrationDate: "2025-01-30T16:20:00Z",
    referralCode: "BONUS18",
    referrals: 45,
    totalDeposits: 12350.00,
    commissionEarned: 2223.00,
    paidCommission: 2223.00,
    pendingCommission: 0
  }
];

// Mock data for affiliate referrals
const mockReferrals = [
  { id: 1, affiliateId: 1, username: "user123", registrationDate: "2025-02-15T10:30:00Z", totalDeposits: 350.00, totalWagers: 1250.00, commission: 87.50 },
  { id: 2, affiliateId: 1, username: "gambler777", registrationDate: "2025-02-18T14:20:00Z", totalDeposits: 1000.00, totalWagers: 4250.00, commission: 250.00 },
  { id: 3, affiliateId: 1, username: "slotFan22", registrationDate: "2025-02-20T09:15:00Z", totalDeposits: 500.00, totalWagers: 1850.00, commission: 125.00 },
  { id: 4, affiliateId: 2, username: "highRoller", registrationDate: "2025-03-05T16:45:00Z", totalDeposits: 2500.00, totalWagers: 10250.00, commission: 500.00 },
  { id: 5, affiliateId: 2, username: "luckySpin", registrationDate: "2025-03-10T11:30:00Z", totalDeposits: 200.00, totalWagers: 750.00, commission: 40.00 }
];

// Mock data for affiliate transactions
const mockTransactions = [
  { id: 1, affiliateId: 1, date: "2025-03-15T12:30:00Z", amount: 5000.00, type: "payment", status: "completed", reference: "INV-2025-001" },
  { id: 2, affiliateId: 1, date: "2025-04-15T14:15:00Z", amount: 5000.00, type: "payment", status: "completed", reference: "INV-2025-012" },
  { id: 3, affiliateId: 2, date: "2025-03-20T09:45:00Z", amount: 2500.00, type: "payment", status: "completed", reference: "INV-2025-003" },
  { id: 4, affiliateId: 2, date: "2025-04-20T10:30:00Z", amount: 2500.00, type: "payment", status: "completed", reference: "INV-2025-015" },
  { id: 5, affiliateId: 4, date: "2025-04-01T15:20:00Z", amount: 4000.00, type: "payment", status: "completed", reference: "INV-2025-008" }
];

// Define affiliate form type
interface AffiliateFormData {
  name: string;
  email: string;
  website: string;
  commission: string;
  notes: string;
}

export default function AffiliatesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewAffiliateDialog, setShowNewAffiliateDialog] = useState(false);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // New affiliate form data
  const [formData, setFormData] = useState<AffiliateFormData>({
    name: "",
    email: "",
    website: "",
    commission: "20", // Default commission
    notes: ""
  });

  // In a real implementation, we would fetch this data from the API
  const { data: affiliates, isLoading } = useQuery({
    queryKey: ['/api/admin/affiliates'],
    queryFn: () => Promise.resolve(mockAffiliates),
  });

  const { data: referrals } = useQuery({
    queryKey: ['/api/admin/affiliates/referrals', selectedAffiliateId],
    queryFn: () => Promise.resolve(
      mockReferrals.filter(r => r.affiliateId === selectedAffiliateId)
    ),
    enabled: !!selectedAffiliateId
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/admin/affiliates/transactions', selectedAffiliateId],
    queryFn: () => Promise.resolve(
      mockTransactions.filter(t => t.affiliateId === selectedAffiliateId)
    ),
    enabled: !!selectedAffiliateId
  });

  // Get selected affiliate
  const selectedAffiliate = affiliates?.find(a => a.id === selectedAffiliateId);

  // Filter affiliates based on search query and status
  const filteredAffiliates = affiliates ? affiliates.filter(affiliate => {
    const matchesSearch = 
      searchQuery === "" || 
      affiliate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      affiliate.status === statusFilter;
    
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

  // Handle status change
  const handleStatusChange = (affiliateId: number, status: string) => {
    toast({
      title: `Affiliate status updated`,
      description: `Affiliate #${affiliateId} status changed to ${status}.`,
    });
  };

  // Copy referral link
  const copyReferralLink = (code: string) => {
    navigator.clipboard.writeText(`https://luckypunt.com/ref/${code}`);
    toast({
      title: "Referral link copied",
      description: "The referral link has been copied to your clipboard.",
    });
  };

  // Handle form input change
  const handleInputChange = (field: keyof AffiliateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmitAffiliate = () => {
    // In a real implementation, we would send this data to the API
    toast({
      title: "Affiliate created",
      description: `Affiliate "${formData.name}" has been created successfully.`,
    });
    setShowNewAffiliateDialog(false);
    // Reset form
    setFormData({
      name: "",
      email: "",
      website: "",
      commission: "20",
      notes: ""
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {selectedAffiliateId ? (
          // Affiliate details view
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedAffiliateId(null)}
                >
                  Back
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">
                  {selectedAffiliate?.name}
                </h2>
                <Badge className={`ml-2 ${
                  selectedAffiliate?.status === "active" 
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/25" 
                    : selectedAffiliate?.status === "pending" 
                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/25" 
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/25"
                }`}>
                  {selectedAffiliate && selectedAffiliate.status ? selectedAffiliate.status.charAt(0).toUpperCase() + selectedAffiliate.status.slice(1) : ''}
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {selectedAffiliate?.status === "active" ? (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(selectedAffiliateId, "suspended")}
                      className="text-amber-500"
                    >
                      <XCircle className="mr-2 h-4 w-4" /> 
                      Suspend Affiliate
                    </DropdownMenuItem>
                  ) : selectedAffiliate?.status === "suspended" ? (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(selectedAffiliateId, "active")}
                      className="text-green-500"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> 
                      Reactivate Affiliate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => handleStatusChange(selectedAffiliateId, "active")}
                      className="text-green-500"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> 
                      Approve Affiliate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => copyReferralLink(selectedAffiliate?.referralCode || "")}
                  >
                    <Link className="mr-2 h-4 w-4" /> 
                    Copy Referral Link
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" /> 
                    Generate Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd>{selectedAffiliate?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Website</dt>
                      <dd>
                        <a 
                          href={selectedAffiliate?.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {selectedAffiliate?.website}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                      <dd>{selectedAffiliate && formatDate(selectedAffiliate.registrationDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                      <dd>{selectedAffiliate?.commission}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Referral Code</dt>
                      <dd className="flex items-center gap-2">
                        <code className="bg-gray-800 px-2 py-1 rounded">{selectedAffiliate?.referralCode}</code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyReferralLink(selectedAffiliate?.referralCode || "")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Referrals</p>
                      <p className="text-2xl font-bold">{selectedAffiliate?.referrals}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Deposits</p>
                      <p className="text-2xl font-bold">{selectedAffiliate && formatCurrency(selectedAffiliate.totalDeposits)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Earned Commission</p>
                      <p className="text-2xl font-bold">{selectedAffiliate && formatCurrency(selectedAffiliate.commissionEarned)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Commission</p>
                      <p className="text-2xl font-bold">{selectedAffiliate && formatCurrency(selectedAffiliate.pendingCommission)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Over Time</CardTitle>
                    <CardDescription>
                      Monthly referrals and commission data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-2">
                    <div className="h-[350px] flex items-center justify-center">
                      <BarChart4 className="h-16 w-16 text-gray-400" />
                      <p className="ml-4 text-gray-400">Performance chart would display here in a real implementation</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="referrals" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Referred Players</CardTitle>
                    <CardDescription>
                      Players who signed up using this affiliate's referral code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Total Deposits</TableHead>
                          <TableHead>Total Wagers</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals && referrals.length > 0 ? (
                          referrals.map((referral) => (
                            <TableRow key={referral.id}>
                              <TableCell>{referral.id}</TableCell>
                              <TableCell>{referral.username}</TableCell>
                              <TableCell>{formatDate(referral.registrationDate)}</TableCell>
                              <TableCell>{formatCurrency(referral.totalDeposits)}</TableCell>
                              <TableCell>{formatCurrency(referral.totalWagers)}</TableCell>
                              <TableCell>{formatCurrency(referral.commission)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <Eye size={16} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No referrals found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transactions" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Transactions</CardTitle>
                    <CardDescription>
                      History of commission payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions && transactions.length > 0 ? (
                          transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.id}</TableCell>
                              <TableCell>{formatDate(transaction.date)}</TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell className="capitalize">{transaction.type}</TableCell>
                              <TableCell>
                                <Badge className={
                                  transaction.status === "completed" 
                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/25" 
                                    : transaction.status === "pending" 
                                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/25" 
                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/25"
                                }>
                                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>{transaction.reference}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          // Affiliates list view
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold tracking-tight">Affiliates</h2>
              <Dialog open={showNewAffiliateDialog} onOpenChange={setShowNewAffiliateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus size={16} />
                    <span>New Affiliate</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Affiliate</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to register a new affiliate partner.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Affiliate Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., BettingExperts"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="e.g., partners@example.com"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="e.g., https://example.com"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="commission">Commission Rate (%)</Label>
                      <Input
                        id="commission"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.commission}
                        onChange={(e) => handleInputChange("commission", e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        placeholder="Additional information about this affiliate..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewAffiliateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" onClick={handleSubmitAffiliate}>
                      Create Affiliate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters and search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search affiliates..."
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
                  <SelectItem value="all">All Affiliates</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Affiliates table */}
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Partners</CardTitle>
                <CardDescription>
                  Manage affiliate partners and their commission rates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Total Commission</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isLoading && filteredAffiliates.length > 0 ? (
                      filteredAffiliates.map((affiliate) => (
                        <TableRow key={affiliate.id}>
                          <TableCell>{affiliate.id}</TableCell>
                          <TableCell>{affiliate.name}</TableCell>
                          <TableCell>{affiliate.email}</TableCell>
                          <TableCell>{affiliate.commission}%</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                affiliate.status === "active" 
                                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/25" 
                                  : affiliate.status === "pending" 
                                  ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/25" 
                                  : "bg-red-500/20 text-red-400 hover:bg-red-500/25"
                              }
                            >
                              {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{affiliate.referrals}</TableCell>
                          <TableCell>{formatCurrency(affiliate.commissionEarned)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyReferralLink(affiliate.referralCode)}
                              >
                                <Link size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedAffiliateId(affiliate.id)}
                              >
                                <Eye size={16} />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal size={16} />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setSelectedAffiliateId(affiliate.id)}>
                                    <Eye className="mr-2 h-4 w-4" /> 
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyReferralLink(affiliate.referralCode)}>
                                    <Link className="mr-2 h-4 w-4" /> 
                                    Copy Referral Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {affiliate.status === "active" ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(affiliate.id, "suspended")}
                                      className="text-amber-500"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" /> 
                                      Suspend Affiliate
                                    </DropdownMenuItem>
                                  ) : affiliate.status === "suspended" ? (
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(affiliate.id, "active")}
                                      className="text-green-500"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" /> 
                                      Reactivate Affiliate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      onClick={() => handleStatusChange(affiliate.id, "active")}
                                      className="text-green-500"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" /> 
                                      Approve Affiliate
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          {isLoading ? "Loading..." : "No affiliates found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Affiliates
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {affiliates?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {affiliates?.filter(a => a.status === "active").length || 0} active affiliates
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Referrals
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {affiliates?.reduce((sum, a) => sum + a.referrals, 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Through all affiliate partners
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Commission
                  </CardTitle>
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(affiliates?.reduce((sum, a) => sum + a.commissionEarned, 0) || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(affiliates?.reduce((sum, a) => sum + a.pendingCommission, 0) || 0)} pending
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}