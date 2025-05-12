import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Phone, Mail, Lock, User, X } from "lucide-react";

// Form validation schemas
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const phoneSchema = z.object({
  phoneNumber: z.string().optional(),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type PhoneFormValues = z.infer<typeof phoneSchema>;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");

  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Phone number form
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: user?.phoneNumber || "",
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

  // Mutation to update phone number
  const phoneMutation = useMutation({
    mutationFn: async (data: PhoneFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your phone number has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle password form submission
  const onPasswordSubmit = (values: PasswordFormValues) => {
    passwordMutation.mutate(values);
  };

  // Handle phone form submission
  const onPhoneSubmit = (values: PhoneFormValues) => {
    phoneMutation.mutate(values);
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark border-border/40 max-w-md p-0 pt-6 overflow-hidden">
        <DialogHeader className="mb-0 px-6">
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <User className="mr-2 h-5 w-5 text-primary" />
              <span>Profile</span>
            </div>
            <DialogClose className="rounded-full h-6 w-6 p-0 hover:bg-primary/10">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Manage your account settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-dark/50 border-b border-border/40 p-0 h-10 rounded-none w-full">
            <TabsTrigger
              value="account"
              className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <User className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="loyalty"
              className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Shield className="mr-2 h-4 w-4" />
              Loyalty
            </TabsTrigger>
          </TabsList>

          {/* Account Tab Content */}
          <TabsContent value="account" className="space-y-4 py-4 px-6">
            <div className="space-y-4">
              {/* User Email */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center space-x-2 rounded-md border border-border/70 p-2 bg-dark/30">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{user.email}</span>
                </div>
              </div>

              {/* Phone Number */}
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-1.5">
                  <FormField
                    control={phoneForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex space-x-2">
                          <FormControl>
                            <div className="flex items-center space-x-2 rounded-md border border-border/70 p-2 bg-dark/30 w-full">
                              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                              <Input 
                                placeholder="Phone number" 
                                {...field} 
                                className="border-0 h-6 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </FormControl>
                          <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/90 h-9" 
                            disabled={phoneMutation.isPending}
                          >
                            {phoneMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            <Card className="bg-dark border-border/40 shadow-none">
              <CardContent className="p-4 pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-primary" />
                  Change Password
                </h4>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2 rounded-md border border-border/70 p-2 bg-dark/30">
                              <Lock className="h-4 w-4 text-primary" />
                              <Input 
                                type="password" 
                                placeholder="Current password" 
                                {...field} 
                                className="border-0 h-6 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2 rounded-md border border-border/70 p-2 bg-dark/30">
                              <Lock className="h-4 w-4 text-primary" />
                              <Input 
                                type="password" 
                                placeholder="New password (min 6 characters)" 
                                {...field} 
                                className="border-0 h-6 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2 rounded-md border border-border/70 p-2 bg-dark/30">
                              <Lock className="h-4 w-4 text-primary" />
                              <Input 
                                type="password" 
                                placeholder="Confirm new password" 
                                {...field} 
                                className="border-0 h-6 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 h-9"
                      disabled={passwordMutation.isPending}
                    >
                      {passwordMutation.isPending ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : null}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab Content */}
          <TabsContent value="loyalty" className="px-6 py-4">
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1">Coming Soon</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Our loyalty program is currently under development.
              </p>
              <Button variant="outline" disabled size="sm">Explore Rewards</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}