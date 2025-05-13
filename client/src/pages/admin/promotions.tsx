import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  CalendarDays,
  CircleDollarSign, 
  Gift, 
  Percent,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
  AlertCircle
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
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Mock data for promotions - would be fetched from API in real implementation
const mockPromotions = [
  { 
    id: 1, 
    name: "Welcome Bonus", 
    description: "100% bonus on first deposit up to $500",
    bonusType: "deposit_match",
    bonusValue: "100",
    maxBonus: "500",
    minDeposit: "20",
    active: true,
    maxUsagePerDay: 1,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Available every day
    timezone: "Australia/Sydney",
    wagerRequirement: 35,
    usageCount: 423,
    totalValue: 156750.00
  },
  { 
    id: 3, 
    name: "Reload Bonus", 
    description: "50% bonus on deposits up to $200, available once per day on weekdays",
    bonusType: "deposit_match",
    bonusValue: "50",
    maxBonus: "200",
    minDeposit: "50",
    active: true,
    maxUsagePerDay: 1,
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    timezone: "Australia/Sydney",
    wagerRequirement: 30,
    usageCount: 542,
    totalValue: 64350.00
  }
];

// Define promotion form type
interface PromotionFormData {
  name: string;
  description: string;
  bonusType: string;
  bonusValue: string;
  maxBonus: string;
  minDeposit: string;
  wagerRequirement: string;
  maxUsagePerDay: number;
  daysOfWeek: number[];
  timezone: string;
  active: boolean;
}

export default function PromotionsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewPromotionDialog, setShowNewPromotionDialog] = useState(false);
  
  // New promotion form data
  const [formData, setFormData] = useState<PromotionFormData>({
    name: "",
    description: "",
    bonusType: "deposit_match",
    bonusValue: "",
    maxBonus: "",
    minDeposit: "",
    wagerRequirement: "",
    maxUsagePerDay: 1,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Default to all days
    timezone: "Australia/Sydney",
    active: true
  });

  // In a real implementation, we would fetch this data from the API
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['/api/admin/promotions'],
    queryFn: () => Promise.resolve(mockPromotions),
  });

  // Filter promotions based on search query and status
  const filteredPromotions = promotions ? promotions.filter(promo => {
    const matchesSearch = 
      searchQuery === "" || 
      promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && promo.active) ||
      (statusFilter === "inactive" && !promo.active);
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No End Date";
    return format(new Date(dateString), "PPP");
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
  const handleStatusChange = (promoId: number, active: boolean) => {
    toast({
      title: `Promotion ${active ? 'activated' : 'deactivated'}`,
      description: `Promotion #${promoId} has been ${active ? 'activated' : 'deactivated'}.`,
    });
  };

  // Handle form input change
  const handleInputChange = (field: keyof PromotionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmitPromotion = () => {
    // In a real implementation, we would send this data to the API
    toast({
      title: "Promotion created",
      description: `Promotion "${formData.name}" has been created successfully.`,
    });
    setShowNewPromotionDialog(false);
    // Reset form
    setFormData({
      name: "",
      description: "",
      bonusType: "deposit_match",
      bonusValue: "",
      maxBonus: "",
      minDeposit: "",
      wagerRequirement: "",
      startDate: new Date(),
      endDate: undefined,
      active: true
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Promotions</h2>
          <Dialog open={showNewPromotionDialog} onOpenChange={setShowNewPromotionDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} />
                <span>New Promotion</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Promotion</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new promotion.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Promotion Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Welcome Bonus"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the promotion..."
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="bonusType">Bonus Type</Label>
                  <Select
                    value={formData.bonusType}
                    onValueChange={(value) => handleInputChange("bonusType", value)}
                  >
                    <SelectTrigger id="bonusType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit_match">Deposit Match (%)</SelectItem>
                      <SelectItem value="free_spins">Free Spins</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                      <SelectItem value="cashback">Cashback (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bonusValue">
                      {formData.bonusType === "deposit_match" || formData.bonusType === "cashback" 
                        ? "Bonus Percentage (%)" 
                        : formData.bonusType === "free_spins" 
                        ? "Number of Spins" 
                        : "Bonus Amount ($)"}
                    </Label>
                    <Input
                      id="bonusValue"
                      value={formData.bonusValue}
                      onChange={(e) => handleInputChange("bonusValue", e.target.value)}
                      placeholder={formData.bonusType === "deposit_match" ? "e.g., 100" : "e.g., 50"}
                    />
                  </div>
                  
                  {formData.bonusType !== "free_spins" && (
                    <div className="grid gap-2">
                      <Label htmlFor="maxBonus">Max Bonus ($)</Label>
                      <Input
                        id="maxBonus"
                        value={formData.maxBonus}
                        onChange={(e) => handleInputChange("maxBonus", e.target.value)}
                        placeholder="e.g., 500"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minDeposit">Min Deposit ($)</Label>
                    <Input
                      id="minDeposit"
                      value={formData.minDeposit}
                      onChange={(e) => handleInputChange("minDeposit", e.target.value)}
                      placeholder="e.g., 20"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="wagerRequirement">Wager Requirement (x)</Label>
                    <Input
                      id="wagerRequirement"
                      value={formData.wagerRequirement}
                      onChange={(e) => handleInputChange("wagerRequirement", e.target.value)}
                      placeholder="e.g., 35"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => handleInputChange("startDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : <span>No end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => handleInputChange("endDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => handleInputChange("active", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="active" className="text-sm font-normal">
                    Activate promotion immediately
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewPromotionDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleSubmitPromotion}>
                  Create Promotion
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
              placeholder="Search promotions..."
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
              <SelectItem value="all">All Promotions</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promotions cards grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {!isLoading && filteredPromotions.length > 0 ? (
            filteredPromotions.map((promo) => (
              <Card key={promo.id} className={cn(
                "overflow-hidden",
                !promo.active && "opacity-70"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{promo.name}</CardTitle>
                    <Badge variant={promo.active ? "default" : "secondary"}>
                      {promo.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{promo.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        Type
                      </span>
                      <span className="capitalize">
                        {promo.bonusType.replace("_", " ")}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        {promo.bonusType === "deposit_match" || promo.bonusType === "cashback" ? (
                          <Percent className="h-4 w-4" />
                        ) : (
                          <CircleDollarSign className="h-4 w-4" />
                        )}
                        Value
                      </span>
                      <span>
                        {promo.bonusType === "deposit_match" || promo.bonusType === "cashback" 
                          ? `${promo.bonusValue}%` 
                          : promo.bonusType === "free_spins"
                          ? `${promo.bonusValue} spins`
                          : formatCurrency(parseFloat(promo.bonusValue))}
                        {promo.maxBonus && promo.bonusType !== "fixed_amount" && 
                          ` up to ${formatCurrency(parseFloat(promo.maxBonus))}`}
                      </span>
                    </div>
                    
                    {promo.minDeposit && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <CircleDollarSign className="h-4 w-4" />
                          Min Deposit
                        </span>
                        <span>{formatCurrency(parseFloat(promo.minDeposit))}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Dates
                      </span>
                      <span className="text-right">
                        {formatDate(promo.startDate)}
                        {promo.endDate && <span> — {formatDate(promo.endDate)}</span>}
                      </span>
                    </div>
                    
                    {promo.usageCount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Usage</span>
                        <span>
                          {promo.usageCount} claims 
                          {promo.totalValue > 0 && ` (${formatCurrency(promo.totalValue)})`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal size={16} />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> 
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {promo.active ? (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(promo.id, false)}
                          className="text-amber-500"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> 
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(promo.id, true)}
                          className="text-green-500"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> 
                          Activate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-500">
                        <Trash className="mr-2 h-4 w-4" /> 
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              {isLoading ? (
                <p>Loading promotions...</p>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No promotions found</h3>
                  <p className="text-gray-500 mt-2">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria." 
                      : "Create your first promotion to get started."}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}