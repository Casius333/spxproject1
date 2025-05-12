import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Receipt, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBalanceContext } from "@/contexts/balance-context";
import { formatCurrency } from "@/lib/utils";

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
  const { balance } = useBalanceContext();
  const [, navigate] = useLocation();

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

  const handleTransactionHistory = () => {
    navigate('/transaction-history');
    onOpenChange(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border-none max-w-sm p-0 overflow-hidden">
        <DialogDescription className="sr-only">
          Account information and options
        </DialogDescription>
        
        {/* Email header with close button */}
        <div className="p-6 pb-4 flex justify-between items-center">
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-amber-400">{user.email}</h2>
          </div>
          <Button 
            onClick={() => onOpenChange(false)} 
            variant="ghost" 
            className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-transparent absolute right-4 top-4"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Divider line */}
        <div className="border-t border-gray-700 mx-4"></div>
        
        {/* Balance section */}
        <div className="p-6 pt-4 pb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Real balance</span>
            <span className="text-white font-semibold">{formatCurrency(balance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Casino Bonus balance</span>
            <span className="text-white font-semibold">{formatCurrency(0)}</span>
          </div>
        </div>
        
        {/* Divider line */}
        <div className="border-t border-gray-700 mx-4 my-2"></div>
        
        {/* Menu options */}
        <div className="p-4">
          {/* Transaction history button */}
          <button 
            onClick={handleTransactionHistory}
            className="w-full flex items-center justify-between bg-[#232736] hover:bg-[#2a2f3e] p-4 rounded-md transition-colors mb-3"
          >
            <div className="flex items-center">
              <Receipt className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-gray-200">Transaction history</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Change Password section */}
          <div className="w-full bg-[#232736] p-4 rounded-md">
            <h3 className="text-sm font-medium mb-3 text-gray-300">Change Password</h3>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-2">
              <div className="rounded-md border border-gray-700 bg-[#1a1f2e]/80 p-2 flex items-center">
                <input 
                  {...passwordForm.register("currentPassword")}
                  type="password" 
                  placeholder="Current password" 
                  className="bg-transparent border-0 text-sm text-gray-300 w-full focus:outline-none"
                />
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-red-400 mt-1">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
              
              <div className="rounded-md border border-gray-700 bg-[#1a1f2e]/80 p-2 flex items-center">
                <input 
                  {...passwordForm.register("newPassword")}
                  type="password" 
                  placeholder="New password (min 6 characters)" 
                  className="bg-transparent border-0 text-sm text-gray-300 w-full focus:outline-none"
                />
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-red-400 mt-1">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
              
              <div className="rounded-md border border-gray-700 bg-[#1a1f2e]/80 p-2 flex items-center">
                <input 
                  {...passwordForm.register("confirmPassword")}
                  type="password" 
                  placeholder="Confirm new password" 
                  className="bg-transparent border-0 text-sm text-gray-300 w-full focus:outline-none"
                />
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
              
              <Button 
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-black h-9"
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