import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Shield, Phone, Mail, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

export default function ProfilePage() {
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and set your preferences.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border">
            <TabsList className="bg-transparent">
              <TabsTrigger 
                value="account" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <User className="mr-2 h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger 
                value="loyalty" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Shield className="mr-2 h-4 w-4" />
                Loyalty
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Tab Content */}
          <TabsContent value="account" className="space-y-6 py-4">
            <Card className="bg-dark-card border-border/40">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  View and update your account details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6">
                  {/* User Email */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                    <div className="flex items-center space-x-2 rounded-md border border-border p-3 bg-dark/30">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">{user.email}</span>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <div className="flex items-center space-x-2 rounded-md border border-border p-3 bg-dark/30">
                      <User className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">{user.username}</span>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                      <FormField
                        control={phoneForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <div className="flex items-center space-x-2 rounded-md border border-border p-3 bg-dark/30 w-full">
                                  <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                                  <Input 
                                    placeholder="Enter your phone number" 
                                    {...field} 
                                    className="border-0 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                                  />
                                </div>
                              </FormControl>
                              <Button 
                                type="submit" 
                                className="bg-primary hover:bg-primary/90" 
                                disabled={phoneMutation.isPending}
                              >
                                {phoneMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Save
                              </Button>
                            </div>
                            <FormDescription>
                              Your phone number will be used for account security and notifications.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>

                  {/* Registration Date */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                    <div className="flex items-center space-x-2 rounded-md border border-border p-3 bg-dark/30">
                      <span className="text-sm text-foreground">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-border/40">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2 rounded-md border border-border p-3 bg-dark/30">
                              <Lock className="h-5 w-5 text-primary" />
                              <Input 
                                type="password" 
                                placeholder="Enter your current password" 
                                {...field} 
                                className="border-0 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
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
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2 rounded-md border border-border p-3 bg-dark/30">
                              <Lock className="h-5 w-5 text-primary" />
                              <Input 
                                type="password" 
                                placeholder="Enter your new password" 
                                {...field} 
                                className="border-0 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2 rounded-md border border-border p-3 bg-dark/30">
                              <Lock className="h-5 w-5 text-primary" />
                              <Input 
                                type="password" 
                                placeholder="Confirm your new password" 
                                {...field} 
                                className="border-0 bg-transparent focus-visible:ring-0 p-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={passwordMutation.isPending}
                    >
                      {passwordMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab Content */}
          <TabsContent value="loyalty" className="space-y-6 py-4">
            <Card className="bg-dark-card border-border/40">
              <CardHeader>
                <CardTitle>Loyalty Program</CardTitle>
                <CardDescription>
                  Track your loyalty status and rewards.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-primary/10 p-6 mb-4">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md">
                  Our loyalty program is currently under development. Stay tuned for exciting rewards and benefits!
                </p>
              </CardContent>
              <CardFooter className="flex justify-center pb-6 pt-0">
                <Button variant="outline" disabled>Explore Rewards</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}