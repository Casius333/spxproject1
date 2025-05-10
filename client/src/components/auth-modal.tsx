import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { X, Loader2, Mail } from "lucide-react";
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
import { cn } from "@/lib/utils";
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

// OTP verification schema
const otpSchema = z.object({
  otp: z.string().min(6, "Please enter a valid verification code").max(8, "Please enter a valid verification code")
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { user, loginMutation, registerMutation, verifyOtpMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const [showVerification, setShowVerification] = useState<boolean>(false);

  // Close the modal if user successfully logs in
  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);
  
  // Check if we need to show verification based on mutation results
  useEffect(() => {
    if (loginMutation.data?.verification_required) {
      setVerificationEmail(loginMutation.data.verification_email || "");
      setShowVerification(true);
    } else if (registerMutation.data?.verification_required) {
      setVerificationEmail(registerMutation.data.verification_email || "");
      setShowVerification(true);
    }
  }, [loginMutation.data, registerMutation.data]);

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
  
  // OTP verification form
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
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
  
  // Handle OTP verification submission
  function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    verifyOtpMutation.mutate({
      email: verificationEmail,
      otp: values.otp
    });
  }
  
  // Reset verification state
  function resetVerification() {
    setShowVerification(false);
    setVerificationEmail("");
    otpForm.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-dark-card" aria-describedby="auth-modal-description">
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription id="auth-modal-description" className="sr-only">
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
          <TabsList className="grid w-full grid-cols-2 mb-2 mt-4 px-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

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
                          <Input placeholder="Enter your email" type="email" {...field} />
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
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Empty space to match register form height */}
                  <div className="h-[100px]"></div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-light text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
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
                          <Input type="email" placeholder="Enter your email" {...field} />
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
                          <Input type="password" placeholder="Create a password" {...field} />
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
                    className="w-full bg-primary hover:bg-primary-light text-white"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
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