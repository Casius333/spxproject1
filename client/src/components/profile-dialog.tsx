import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Receipt, Loader2, Trophy, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useProfileDialog } from "@/contexts/profile-dialog-context";

// Form validation schemas
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { navigateToTransactionHistory, openLoyalty } = useProfileDialog();

  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mutation to update password
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("POST", "/api/user/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle password form submission
  const onPasswordSubmit = (values: PasswordFormValues) => {
    passwordMutation.mutate(values);
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark border-border/40 max-w-sm p-0 overflow-hidden">
        <DialogTitle className="sr-only">User Profile</DialogTitle>
        <DialogDescription className="sr-only">
          Account information and options
        </DialogDescription>
        
        {/* Email header with close button */}
        <div className="p-6 pb-4 flex justify-between items-center">
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-primary">{user.email}</h2>
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
        
        {/* Balance section */}
        <div className="p-6 pt-4 pb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Real balance</span>
            <span className="text-foreground font-semibold">{formatCurrency(1000)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Casino Bonus balance</span>
            <span className="text-foreground font-semibold">{formatCurrency(0)}</span>
          </div>
        </div>
        
        {/* Divider line */}
        <div className="border-t border-border/70 mx-4 my-2"></div>
        
        {/* Menu options */}
        <div className="p-4 space-y-3">
          {/* Loyalty button */}
          <button 
            onClick={openLoyalty}
            className="w-full flex items-center justify-between bg-dark-card/80 hover:bg-dark-card p-4 rounded-md transition-colors border border-border/40"
          >
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-primary mr-3" />
              <span className="text-foreground">Loyalty Program</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          
          {/* Transaction history button */}
          <button 
            onClick={navigateToTransactionHistory}
            className="w-full flex items-center justify-between bg-dark-card/80 hover:bg-dark-card p-4 rounded-md transition-colors border border-border/40"
          >
            <div className="flex items-center">
              <Receipt className="h-5 w-5 text-primary mr-3" />
              <span className="text-foreground">Transaction history</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          
          {/* Change Password section */}
          <div className="w-full bg-dark-card/80 p-4 rounded-md border border-border/40">
            <h3 className="text-sm font-medium mb-3 text-foreground">Change Password</h3>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-2">
              <div className="rounded-md border border-border/60 bg-dark/70 p-2 flex items-center">
                <input 
                  {...passwordForm.register("currentPassword")}
                  type="password" 
                  placeholder="Current password" 
                  className="bg-transparent border-0 text-sm text-foreground w-full focus:outline-none"
                />
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
              
              <div className="rounded-md border border-border/60 bg-dark/70 p-2 flex items-center">
                <input 
                  {...passwordForm.register("newPassword")}
                  type="password" 
                  placeholder="New password (min 6 characters)" 
                  className="bg-transparent border-0 text-sm text-foreground w-full focus:outline-none"
                />
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
              
              <div className="rounded-md border border-border/60 bg-dark/70 p-2 flex items-center">
                <input 
                  {...passwordForm.register("confirmPassword")}
                  type="password" 
                  placeholder="Confirm new password" 
                  className="bg-transparent border-0 text-sm text-foreground w-full focus:outline-none"
                />
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
              
              <Button 
                type="submit"
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground h-9"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}