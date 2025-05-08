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
  DialogHeader,
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

// Combined form schema
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().optional(),
  mode: z.enum(["login", "register"]),
}).superRefine((data, ctx) => {
  if (data.mode === "register" && data.confirmPassword !== data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { user, loginMutation, registerMutation } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Close the modal if user successfully logs in
  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  // Combined form
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      mode: defaultMode,
    },
  });

  // Update form mode when switching
  useEffect(() => {
    form.setValue("mode", mode);
  }, [mode, form]);

  // Handle form submission
  function onSubmit(values: z.infer<typeof authSchema>) {
    if (values.mode === "login") {
      loginMutation.mutate({
        email: values.email,
        password: values.password,
      });
    } else {
      registerMutation.mutate({
        email: values.email,
        password: values.password,
      });
    }
  }

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-dark-card">
        <DialogClose className="absolute right-4 top-4 z-10">
          <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 hover:bg-white/10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>
        <DialogHeader className="p-4 pb-0"></DialogHeader>
        
        <div className="flex flex-col w-full">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 mb-6 px-6">
            <Button 
              variant="outline" 
              className={cn(
                "border-primary/30 hover:bg-primary/10",
                mode === "login" && "bg-primary text-white hover:bg-primary/90"
              )}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "border-primary/30 hover:bg-primary/10",
                mode === "register" && "bg-primary text-white hover:bg-primary/90"
              )}
              onClick={() => setMode("register")}
              type="button"
            >
              Register
            </Button>
          </div>

          <div className="px-6 pb-6">
            <DialogTitle className="text-2xl text-white mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </DialogTitle>
            <DialogDescription className="mb-6">
              {mode === "login" 
                ? "Sign in to your account to continue playing" 
                : "Register for a new account to start playing"}
            </DialogDescription>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={mode === "login" ? "Enter your password" : "Create a password"} 
                          {...field} 
                        />
                      </FormControl>
                      {mode === "register" && (
                        <FormDescription>
                          Must be at least 6 characters
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Confirm Password (only for register) */}
                {mode === "register" && (
                  <FormField
                    control={form.control}
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
                )}

                {/* Spacer for login mode to maintain consistent height */}
                {mode === "login" && <div className="h-[84px]"></div>}
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-light text-white"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </Form>
            <div className="flex justify-center mt-4">
              <Button variant="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}