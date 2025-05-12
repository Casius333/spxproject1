import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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
  
  // Hide verification screen if verification is successful
  useEffect(() => {
    if (verifyOtpMutation.isSuccess) {
      setShowVerification(false);
      // Reset the forms in case the user comes back later
      loginForm.reset();
      registerForm.reset();
      otpForm.reset();
    }
  }, [verifyOtpMutation.isSuccess]);
  
  // Reset verification and mutation states when closing modal
  useEffect(() => {
    if (!isOpen) {
      // Small delay to prevent visual glitches
      setTimeout(() => {
        if (showVerification) {
          setShowVerification(false);
          setVerificationEmail("");
          otpForm.reset();
        }
        // Only reset these if we're not in the middle of a verification
        if (!showVerification) {
          loginForm.reset();
          registerForm.reset();
        }
      }, 300);
    }
  }, [isOpen]);
  
  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

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
        <DialogClose asChild className="absolute right-6 top-6 z-10">
          <div className="cursor-pointer h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="h-5 w-5 text-white/70 hover:text-white" />
            <span className="sr-only">Close</span>
          </div>
        </DialogClose>
        
        {/* Show verification form if needed */}
        {showVerification ? (
          <div className="px-6 pb-6 pt-2">
            <div className="min-h-[500px]">
              <h2 className="text-2xl text-white font-bold mb-6 mt-4">Email Verification</h2>
              <div className="flex flex-col items-center justify-center mb-8">
                <Mail className="h-16 w-16 text-primary mb-4" />
                <p className="text-center text-white">
                  We've sent a verification code to<br />
                  <span className="font-bold">{verificationEmail}</span>
                </p>
                <p className="text-center text-white/60 mt-2 text-sm">
                  Please check your email inbox and enter the code below to verify your account.
                </p>
              </div>
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your verification code" 
                            {...field} 
                            className="text-center text-lg tracking-widest"
                            maxLength={8}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Display verification error if there is one */}
                  {verifyOtpMutation.isError && (
                    <div className="text-red-500 text-sm text-center">
                      {verifyOtpMutation.error?.message || "Verification failed. Please try again."}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-light text-white"
                    disabled={verifyOtpMutation.isPending}
                  >
                    {verifyOtpMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Verify Email
                  </Button>
                </form>
              </Form>
              
              {/* Resend verification option */}
              <div className="mt-4 text-center">
                <p className="text-sm text-white/60 mb-2">
                  Didn't receive the code?
                </p>
                <button 
                  className="text-primary hover:text-primary-light text-sm font-medium"
                  onClick={() => {
                    // If the user registered, trigger register again
                    if (registerForm.getValues().email === verificationEmail) {
                      const values = registerForm.getValues();
                      const { confirmPassword, ...registerData } = values;
                      registerMutation.mutate(registerData);
                    } 
                    // If the user tried to log in, trigger login again
                    else if (loginForm.getValues().email === verificationEmail) {
                      loginMutation.mutate(loginForm.getValues());
                    }
                  }}
                >
                  Resend verification code
                </button>
              </div>
              <div className="flex justify-center mt-6">
                <div 
                  className="text-primary hover:text-primary-light cursor-pointer"
                  onClick={resetVerification}
                >
                  Back to login
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                  
                  {/* Display login error if there is one */}
                  {loginMutation.isError && (
                    <div className="text-red-500 text-sm">
                      {loginMutation.error?.message || "Login failed. Please check your credentials."}
                    </div>
                  )}
                  
                  {/* Forgot Password Link */}
                  <div className="flex justify-end mt-1">
                    <button 
                      type="button"
                      className="text-sm text-primary hover:text-primary-light transition-colors"
                      onClick={() => {
                        // Get the email from the form if available
                        const email = loginForm.getValues().email;
                        
                        if (!email) {
                          toast({
                            title: "Email Required",
                            description: "Please enter your email address first",
                            variant: "destructive",
                            duration: 3000,
                          });
                          return;
                        }
                        
                        // Show a toast notification for now 
                        // In a real implementation, this would send a password reset email
                        toast({
                          title: "Password Reset",
                          description: `Password reset instructions sent to ${email}`,
                          duration: 5000,
                        });
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  
                  {/* Space for alignment */}
                  <div className="h-[30px]"></div>
                  
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
                  
                  {/* Display registration error if there is one */}
                  {registerMutation.isError && (
                    <div className="text-red-500 text-sm">
                      {registerMutation.error?.message || "Registration failed. Please try again."}
                    </div>
                  )}
                  
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
        )}
      </DialogContent>
    </Dialog>
  );
}