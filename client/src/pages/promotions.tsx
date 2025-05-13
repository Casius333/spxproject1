import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { Loader2, X, Gift, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import DepositDialog from '@/components/deposit-dialog';

// Types for promotions
interface Promotion {
  id: number;
  name: string;
  description: string;
  bonusType: string;
  bonusValue: string;
  minDeposit: string;
  maxBonus: string | null;
  turnoverRequirement: string;
  imageUrl?: string;
  isActive?: boolean; // From the frontend perspective
}

interface ActivePromotion {
  id: number;
  userId: number;
  promotionId: number;
  depositId: number;
  bonusAmount: string;
  turnoverRequirement: string;
  wageringProgress: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  promotionName: string;
  promotionDescription: string;
  promotionBonusType: string;
  promotionBonusValue: string;
  promotionImageUrl?: string;
}

// Helper function to calculate progress percentage
const calculateProgress = (promotion: ActivePromotion): number => {
  const wageringProgress = parseFloat(promotion.wageringProgress || '0');
  const turnoverRequirement = parseFloat(promotion.turnoverRequirement || '0');
  
  if (turnoverRequirement <= 0) return 0;
  
  return Math.min(100, (wageringProgress / turnoverRequirement) * 100);
};

const PromotionsPage: React.FC = () => {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [promotionToCancel, setPromotionToCancel] = useState<ActivePromotion | null>(null);
  
  // Redirect to auth page if not logged in
  React.useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  // Query to fetch all available promotions
  const { 
    data: availablePromotions, 
    isLoading: isLoadingPromotions 
  } = useQuery({
    queryKey: ['/api/promotions/available'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/promotions/available');
      const data = await res.json();
      return data.promotions || [];
    },
    enabled: !!user,
  });

  // Query to fetch user's active promotions
  const { 
    data: activePromotions, 
    isLoading: isLoadingActive 
  } = useQuery({
    queryKey: ['/api/promotions/active'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/promotions/active');
      const data = await res.json();
      return data.promotions || [];
    },
    enabled: !!user,
  });

  // Mutation to cancel a promotion
  const cancelMutation = useMutation({
    mutationFn: async (userPromotionId: number) => {
      const res = await apiRequest('POST', '/api/promotions/cancel', { userPromotionId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promotions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      toast({
        title: "Promotion Cancelled",
        description: "The promotion has been cancelled successfully.",
      });
      setCancellationDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel promotion.",
        variant: "destructive",
      });
    },
  });

  // Helper mutation for testing wagering progress updates
  const updateProgressMutation = useMutation({
    mutationFn: async ({ userPromotionId, wagerAmount }: { userPromotionId: number, wagerAmount: number }) => {
      const res = await apiRequest('POST', '/api/promotions/update-progress', {
        userPromotionId,
        wagerAmount,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/promotions/active'] });
      toast({
        title: data.message,
        description: "Wagering progress has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update wagering progress.",
        variant: "destructive",
      });
    },
  });

  const handleActivatePromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsDepositDialogOpen(true);
  };

  const handleCancelPromotion = (promotion: ActivePromotion) => {
    setPromotionToCancel(promotion);
    setCancellationDialogOpen(true);
  };

  const confirmCancelPromotion = () => {
    if (promotionToCancel) {
      cancelMutation.mutate(promotionToCancel.id);
    }
  };

  // Helper function to simulate wagering progress (for development purposes)
  const simulateWager = (activePromotion: ActivePromotion) => {
    updateProgressMutation.mutate({
      userPromotionId: activePromotion.id,
      wagerAmount: 10, // Simulate a $10 wager
    });
  };

  if (!user) {
    return null; // Will redirect to auth page
  }

  const isLoading = isLoadingPromotions || isLoadingActive;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Promotions</h1>
      
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="available">Available Promotions</TabsTrigger>
          <TabsTrigger value="active">My Active Promotions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : availablePromotions && availablePromotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availablePromotions.map((promotion: Promotion) => (
                <Card key={promotion.id} className="relative overflow-hidden">
                  {promotion.imageUrl && (
                    <div className="w-full h-48 relative overflow-hidden">
                      <img 
                        src={promotion.imageUrl} 
                        alt={promotion.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{promotion.name}</CardTitle>
                      <Badge className="ml-2">
                        {promotion.bonusType === 'bonus' ? 'Bonus' : 'Cashback'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {promotion.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bonus Value:</span>
                        <span className="font-medium">{promotion.bonusValue}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Min Deposit:</span>
                        <span className="font-medium">${parseFloat(promotion.minDeposit).toFixed(2)}</span>
                      </div>
                      {promotion.maxBonus && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Max Bonus:</span>
                          <span className="font-medium">${parseFloat(promotion.maxBonus).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Turnover Requirement:</span>
                        <span className="font-medium">{parseFloat(promotion.turnoverRequirement)}x</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="text-primary">
                          <Info className="mr-2 h-4 w-4" />
                          Terms
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{promotion.name} - Terms & Conditions</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p>
                            <strong>Bonus Type:</strong> {promotion.bonusType === 'bonus' ? 'Deposit Match' : 'Cashback'}
                          </p>
                          <p>
                            <strong>Bonus Value:</strong> {promotion.bonusValue}%
                          </p>
                          <p>
                            <strong>Minimum Deposit:</strong> ${parseFloat(promotion.minDeposit).toFixed(2)}
                          </p>
                          {promotion.maxBonus && (
                            <p>
                              <strong>Maximum Bonus:</strong> ${parseFloat(promotion.maxBonus).toFixed(2)}
                            </p>
                          )}
                          <p>
                            <strong>Turnover Requirement:</strong> {parseFloat(promotion.turnoverRequirement)}x (deposit + bonus)
                          </p>
                          <Separator />
                          <p className="text-sm text-muted-foreground">
                            By activating this promotion, you agree to the wagering requirements and terms.
                            Bonus funds must be wagered {parseFloat(promotion.turnoverRequirement)}x before withdrawal is allowed.
                            The casino reserves the right to cancel bonuses and any winnings if terms are violated.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      onClick={() => handleActivatePromotion(promotion)}
                      className="bg-primary"
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Activate with Deposit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl">No promotions available right now.</h3>
              <p className="text-muted-foreground mt-2">
                Check back later for new promotions!
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activePromotions && activePromotions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePromotions.map((promotion: ActivePromotion) => (
                <Card key={promotion.id} className="relative overflow-hidden">
                  {promotion.promotionImageUrl && (
                    <div className="w-full h-48 relative overflow-hidden">
                      <img 
                        src={promotion.promotionImageUrl} 
                        alt={promotion.promotionName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{promotion.promotionName}</CardTitle>
                      <Badge className="ml-2">
                        {promotion.promotionBonusType === 'bonus' ? 'Bonus' : 'Cashback'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {promotion.promotionDescription}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bonus Amount:</span>
                        <span className="font-medium">${parseFloat(promotion.bonusAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Wagering Progress:</span>
                        <span className="font-medium">
                          ${parseFloat(promotion.wageringProgress || '0').toFixed(2)} / ${parseFloat(promotion.turnoverRequirement || '0').toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress:</span>
                          <span>{calculateProgress(promotion).toFixed(1)}%</span>
                        </div>
                        <Progress value={calculateProgress(promotion)} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Activated:</span>
                        <span className="font-medium">
                          {new Date(promotion.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    {/* For development testing only - would be removed in production */}
                    <Button 
                      variant="outline" 
                      className="text-primary"
                      onClick={() => simulateWager(promotion)}
                    >
                      Simulate Wager
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      onClick={() => handleCancelPromotion(promotion)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Promotion
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl">No active promotions</h3>
              <p className="text-muted-foreground mt-2">
                You don't have any active promotions at the moment.
              </p>
              <Button 
                className="mt-4 bg-primary"
                onClick={() => setLocation('#available')}
              >
                View Available Promotions
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Deposit Dialog */}
      <DepositDialog 
        isOpen={isDepositDialogOpen}
        onClose={() => setIsDepositDialogOpen(false)}
        selectedPromotion={selectedPromotion}
      />
      
      {/* Confirmation Dialog for Cancelling Promotion */}
      <Dialog open={cancellationDialogOpen} onOpenChange={setCancellationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Promotion</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this promotion? Any bonus funds associated with this promotion will be removed from your account.
            </DialogDescription>
          </DialogHeader>
          
          {promotionToCancel && (
            <div className="py-4">
              <p><strong>Promotion:</strong> {promotionToCancel.promotionName}</p>
              <p><strong>Bonus Amount:</strong> ${parseFloat(promotionToCancel.bonusAmount).toFixed(2)}</p>
              <p><strong>Progress:</strong> {calculateProgress(promotionToCancel).toFixed(1)}% completed</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCancellationDialogOpen(false)}
            >
              Keep Promotion
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelPromotion}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionsPage;