import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(2, "Username is required"),
  password: z.string().min(2, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Create form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Store admin data and token in localStorage
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      
      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      });
      
      // Redirect to admin dashboard
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    loginMutation.mutate(values);
  }
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left column - Login form */}
      <div className="w-full max-w-md p-8 m-auto bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Login</h1>
          <p className="text-gray-400">Enter your credentials to access the admin dashboard</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-light text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Login
            </Button>
          </form>
        </Form>
      </div>
      
      {/* Right column - Admin branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center items-center bg-gradient-to-br from-primary/90 to-primary-light/90 p-10">
        <div className="max-w-lg text-center">
          <h2 className="text-4xl font-bold text-white mb-6">LuckyPunt Admin</h2>
          <p className="text-xl text-white/80">
            Welcome to the LuckyPunt admin dashboard. Access comprehensive analytics, user management, and promotional tools.
          </p>
        </div>
      </div>
    </div>
  );
}