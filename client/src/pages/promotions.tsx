import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { Loader2, X, Gift, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import DepositDialog from '../components/deposit-dialog';

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
  isUsed?: boolean;
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

// Unified promotion type that combines both available and active promotions
interface UnifiedPromotion {
  id: number;
  promotionId?: number;
  name: string;
  description: string;
  bonusType: string;
  bonusValue: string;
  minDeposit?: string;
  maxBonus?: string | null;
  turnoverRequirement: string;
  imageUrl?: string;
  status: 'available' | 'active';
  bonusAmount?: string;
  wageringProgress?: string;
  progress?: number;
  userPromotionId?: number;
  createdAt?: string;
}

// Helper function to calculate progress percentage
const calculateProgress = (promotion: ActivePromotion | UnifiedPromotion): number => {
  const wageringProgress = parseFloat(typeof promotion.wageringProgress === 'string' ? promotion.wageringProgress : '0');
  const turnoverRequirement = parseFloat(promotion.turnoverRequirement || '0');
  
  if (turnoverRequirement <= 0) return 0;
  
  return Math.min(100, (wageringProgress / turnoverRequirement) * 100);
};

// Helper function to merge available and active promotions
const mergePromotions = (
  availablePromotions: Promotion[] = [], 
  activePromotions: ActivePromotion[] = []
): UnifiedPromotion[] => {
  // First convert active promotions to unified format
  const activeUnified: UnifiedPromotion[] = activePromotions.map(ap => ({
    id: ap.promotionId,
    userPromotionId: ap.id,
    name: ap.promotionName,
    description: ap.promotionDescription,
    bonusType: ap.promotionBonusType,
    bonusValue: ap.promotionBonusValue,
    turnoverRequirement: ap.turnoverRequirement,
    imageUrl: ap.promotionImageUrl,
    status: 'active',
    bonusAmount: ap.bonusAmount,
    wageringProgress: ap.wageringProgress,
    progress: calculateProgress(ap),
    createdAt: ap.createdAt
  }));
  
  // Get all promotion IDs that are active
  const activePromotionIds = activeUnified.map(p => p.id);
  
  // Convert available promotions that aren't already active
  const availableUnified: UnifiedPromotion[] = availablePromotions
    .filter(ap => !ap.isUsed && !activePromotionIds.includes(ap.id))
    .map(ap => ({
      id: ap.id,
      name: ap.name,
      description: ap.description,
      bonusType: ap.bonusType,
      bonusValue: ap.bonusValue,
      minDeposit: ap.minDeposit,
      maxBonus: ap.maxBonus,
      turnoverRequirement: ap.turnoverRequirement,
      imageUrl: ap.imageUrl,
      status: 'available'
    }));
  
  // Combine both arrays
  return [...activeUnified, ...availableUnified];
};

const PromotionsPage: React.FC = () => {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [promotionToCancel, setPromotionToCancel] = useState<UnifiedPromotion | null>(null);
  
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

  // Combine promotions into a single unified list
  const unifiedPromotions = useMemo(() => {
    return mergePromotions(availablePromotions, activePromotions);
  }, [availablePromotions, activePromotions]);

  // Mutation to cancel a promotion
  const cancelMutation = useMutation({
    mutationFn: async (userPromotionId: number) => {
      const res = await apiRequest('POST', '/api/promotions/cancel', { userPromotionId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promotions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/promotions/available'] });
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

  const handleActivatePromotion = (promotion: UnifiedPromotion) => {
    const availablePromo = availablePromotions?.find((p: Promotion) => p.id === promotion.id);
    if (availablePromo) {
      setSelectedPromotion(availablePromo);
      setIsDepositDialogOpen(true);
    }
  };

  const handleCancelPromotion = (promotion: UnifiedPromotion) => {
    setPromotionToCancel(promotion);
    setCancellationDialogOpen(true);
  };

  const confirmCancelPromotion = () => {
    if (promotionToCancel && promotionToCancel.userPromotionId) {
      cancelMutation.mutate(promotionToCancel.userPromotionId);
    }
  };

  if (!user) {
    return null; // Will redirect to auth page
  }

  const isLoading = isLoadingPromotions || isLoadingActive;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Promotions</h1>
      
      {/* Unified Promotions Section */}
      <div className="mb-10">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : unifiedPromotions && unifiedPromotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {unifiedPromotions.map((promotion) => (
              <Card key={`${promotion.status}-${promotion.id}`} className="relative overflow-hidden">
                {promotion.imageUrl && (
                  <div className="w-full h-48 relative overflow-hidden">
                    <img 
                      src={promotion.imageUrl} 
                      alt={promotion.name} 
                      className="w-full h-full object-cover"
                    />
                    {promotion.status === 'active' && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </div>
                    )}
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
                  {promotion.status === 'active' ? (
                    // Active promotion content
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bonus Amount:</span>
                        <span className="font-medium">${parseFloat(promotion.bonusAmount || '0').toFixed(2)}</span>
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
                          <span>{(promotion.progress || 0).toFixed(1)}%</span>
                        </div>
                        <Progress value={promotion.progress || 0} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Activated:</span>
                        <span className="font-medium">
                          {promotion.createdAt ? new Date(promotion.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Available promotion content
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bonus Value:</span>
                        <span className="font-medium">{promotion.bonusValue}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Min Deposit:</span>
                        <span className="font-medium">${parseFloat(promotion.minDeposit || '0').toFixed(2)}</span>
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
                  )}
                </CardContent>
                
                <CardFooter className={promotion.status === 'active' ? "flex justify-end" : "flex justify-between"}>
                  {promotion.status === 'available' && (
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
                            <strong>Minimum Deposit:</strong> ${parseFloat(promotion.minDeposit || '0').toFixed(2)}
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
                  )}
                  
                  {promotion.status === 'available' ? (
                    <Button 
                      onClick={() => handleActivatePromotion(promotion)}
                      className="bg-primary"
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Activate with Deposit
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleCancelPromotion(promotion)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Promotion
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/10">
            <h3 className="text-xl">No promotions available</h3>
            <p className="text-muted-foreground mt-2">
              Check back later for new promotions!
            </p>
          </div>
        )}
      </div>
      
      {/* Terms and Conditions Section */}
      <div className="mt-12 border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4">Promotions Terms & Conditions</h2>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p><strong>1. General Terms</strong></p>
          <p>All bonuses and promotions are subject to the following terms and conditions:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bonuses can only be claimed once per player, per household, per IP address, unless otherwise stated.</li>
            <li>LuckyPunt reserves the right to modify or cancel any promotion at any time.</li>
            <li>All promotions are only available to players aged 18+.</li>
            <li>Any attempt to abuse bonuses or promotions may result in the bonus being voided and possible account closure.</li>
          </ul>
          
          <p className="mt-4"><strong>2. Wagering Requirements</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All bonuses are subject to wagering requirements as specified in the promotion details.</li>
            <li>Wagering requirements are calculated based on the bonus amount plus the qualifying deposit, unless otherwise stated.</li>
            <li>Until wagering requirements are met, the maximum bet allowed is $5 per spin or $0.50 per line.</li>
            <li>Different games contribute different percentages towards wagering requirements:
              <ul className="list-disc pl-6 mt-2">
                <li>Slots: 100%</li>
                <li>Table Games: 10%</li>
                <li>Live Dealer Games: 5%</li>
              </ul>
            </li>
          </ul>
          
          <p className="mt-4"><strong>3. Bonus Funds</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bonus funds are kept in a separate balance from real money funds.</li>
            <li>When you have both bonus and real money funds, real money will be used first.</li>
            <li>Bonus funds cannot be withdrawn until wagering requirements have been met.</li>
            <li>If you request a withdrawal before completing the wagering requirements, all bonus funds and winnings from those funds will be forfeited.</li>
          </ul>
          
          <p className="mt-4"><strong>4. Expiration</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bonuses expire after 30 days unless otherwise stated.</li>
            <li>All wagering requirements must be completed within this timeframe.</li>
          </ul>
        </div>
      </div>
      
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
              <p><strong>Promotion:</strong> {promotionToCancel.name}</p>
              {promotionToCancel.bonusAmount && (
                <p><strong>Bonus Amount:</strong> ${parseFloat(promotionToCancel.bonusAmount).toFixed(2)}</p>
              )}
              <p><strong>Progress:</strong> {(promotionToCancel.progress || 0).toFixed(1)}% completed</p>
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