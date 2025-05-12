import React from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Trophy, Star, Shield, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LoyaltyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoyaltyDialog({ open, onOpenChange }: LoyaltyDialogProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const loyaltyPoints = 250; // Placeholder value

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark border-border/40 max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Loyalty Program</DialogTitle>
        <DialogDescription className="sr-only">
          Your loyalty program status and rewards
        </DialogDescription>
        
        {/* Header with close button */}
        <div className="p-6 pb-4 flex justify-between items-center">
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-primary flex items-center justify-center">
              <Trophy className="mr-2 h-5 w-5" />
              Loyalty Program
            </h2>
          </div>
          <Button 
            onClick={() => onOpenChange(false)} 
            variant="ghost" 
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-transparent absolute right-4 top-4"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Divider line */}
        <div className="border-t border-border/70 mx-4"></div>
        
        {/* Current loyalty status */}
        <div className="p-6 pt-4 pb-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-dark-card/60 rounded-lg p-4 space-y-3 border border-border/40">
              <h3 className="text-sm font-medium flex items-center">
                <Star className="mr-2 h-4 w-4 text-primary" />
                Your Loyalty Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Level</span>
                  <span className="text-sm font-medium">Bronze</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Loyalty Points</span>
                  <span className="text-sm font-medium">{loyaltyPoints} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next Level</span>
                  <span className="text-sm font-medium">Silver (500 pts)</span>
                </div>
                <div className="w-full bg-dark/50 rounded-full h-2 mt-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(loyaltyPoints / 500) * 100}%` }}></div>
                </div>
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {250} points to next level
                </div>
              </div>
            </div>
            <div className="bg-dark-card/60 rounded-lg p-4 space-y-3 border border-border/40">
              <h3 className="text-sm font-medium flex items-center">
                <Shield className="mr-2 h-4 w-4 text-primary" />
                Available Rewards
              </h3>
              <div className="space-y-2.5">
                <button className="w-full flex items-center justify-between p-2 rounded hover:bg-dark/30 transition-colors">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-1.5 rounded">
                      <Star className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm ml-2">10% Bonus Deposit</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-dark/40 py-0.5 px-2 rounded mr-1">100 pts</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-2 rounded hover:bg-dark/30 transition-colors">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-1.5 rounded">
                      <Star className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm ml-2">Free Spins × 50</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-dark/40 py-0.5 px-2 rounded mr-1">200 pts</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-2 rounded hover:bg-dark/30 transition-colors opacity-50" disabled>
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-1.5 rounded">
                      <Star className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm ml-2">{formatCurrency(50)} Cash Bonus</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-dark/40 py-0.5 px-2 rounded mr-1">500 pts</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Loyalty levels explanation */}
        <div className="px-6 pb-6">
          <div className="bg-dark-card/60 rounded-lg p-4 border border-border/40">
            <h3 className="text-sm font-medium mb-3">Loyalty Levels & Benefits</h3>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div className="p-2 rounded bg-dark/30 space-y-1">
                <div className="text-xs font-medium">Bronze</div>
                <div className="text-xs text-muted-foreground">0-499 pts</div>
                <div className="text-xs text-primary">1% Cashback</div>
              </div>
              <div className="p-2 rounded bg-dark/30 space-y-1">
                <div className="text-xs font-medium">Silver</div>
                <div className="text-xs text-muted-foreground">500-999 pts</div>
                <div className="text-xs text-primary">2% Cashback</div>
              </div>
              <div className="p-2 rounded bg-dark/30 space-y-1">
                <div className="text-xs font-medium">Gold</div>
                <div className="text-xs text-muted-foreground">1000-2499 pts</div>
                <div className="text-xs text-primary">3% Cashback</div>
              </div>
              <div className="p-2 rounded bg-dark/30 space-y-1">
                <div className="text-xs font-medium">Platinum</div>
                <div className="text-xs text-muted-foreground">2500+ pts</div>
                <div className="text-xs text-primary">5% Cashback</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}