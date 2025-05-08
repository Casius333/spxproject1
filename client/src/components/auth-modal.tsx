import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Close the modal if user successfully logs in
  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login form submission
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  // Handle register form submission
  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  }

  // Log when the modal should be opening
  console.log("Auth modal rendering with isOpen:", isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-dark-card relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary.DEFAULT)/5,transparent_60%)] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        <DialogTitle>Authentication</DialogTitle>
        <DialogDescription>
          Sign in to your account or create a new one
        </DialogDescription>
        <DialogClose asChild className="absolute right-4 top-4 z-10">
          <div className="cursor-pointer h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </div>
        </DialogClose>
        <Tabs 
          defaultValue={activeTab} 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/20 to-transparent">
            <TabsList className="grid w-full grid-cols-2 mb-0 rounded-lg border border-primary/30 shadow-lg overflow-hidden">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-inner py-3 text-base font-medium transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs">→</span>
                  </div>
                  Login
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-inner py-3 text-base font-medium transition-all duration-200"
              >
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs">+</span>
                  </div>
                  Register
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Login Tab */}
          <TabsContent value="login" className="px-6 pb-6 pt-2">
            <div className="min-h-[500px]"> {/* Fixed height container */}
              <h2 className="text-2xl text-white font-bold mb-6 mt-0">Welcome Back</h2>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your email" 
                            type="email" 
                            className="bg-black/30 border-primary/30 focus:border-primary transition-colors duration-200" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            className="bg-black/30 border-primary/30 focus:border-primary transition-colors duration-200"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Empty space to match register form height */}
                  <div className="h-[100px]"></div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary-light text-white h-12 text-lg font-bold shadow-lg transition-all duration-300 hover:shadow-primary/50"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2">
                        <span className="text-xs">→</span>
                      </div>
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>
              <div className="flex justify-center mt-4">
                <div 
                  className="text-primary hover:text-primary-light cursor-pointer"
                  onClick={() => setActiveTab("register")}
                >
                  Don't have an account? Register
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="px-6 pb-6 pt-2">
            <div className="min-h-[500px]"> {/* Fixed height container */}
              <h2 className="text-2xl text-white font-bold mb-6 mt-0">Create Account</h2>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="bg-black/30 border-primary/30 focus:border-primary transition-colors duration-200"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            className="bg-black/30 border-primary/30 focus:border-primary transition-colors duration-200"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Must be at least 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary-light text-white h-12 text-lg font-bold shadow-lg transition-all duration-300 hover:shadow-primary/50"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center mr-2">
                        <span className="text-xs">+</span>
                      </div>
                    )}
                    Create Account
                  </Button>
                </form>
              </Form>
              <div className="flex justify-center mt-4">
                <div 
                  className="text-primary hover:text-primary-light cursor-pointer"
                  onClick={() => setActiveTab("login")}
                >
                  Already have an account? Sign in
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}