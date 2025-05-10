import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, setAuthToken, removeAuthToken } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
  verifyOtpMutation: UseMutationResult<any, Error, VerifyOtpData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
};

type VerifyOtpData = {
  email: string;
  otp: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      
      // Check if verification is required
      if (data.verification_required) {
        return { 
          ...data,
          verification_email: credentials.email 
        };
      }
      
      // Store the auth token from the response
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      
      return data; // Return the complete response
    },
    onSuccess: (data) => {
      // If verification is required, don't set the user or show a welcome message
      if (data.verification_required) {
        toast({
          title: "Verification required",
          description: "Please check your email for a verification code.",
        });
        return;
      }
      
      if (data.user) {
        queryClient.setQueryData(["/api/user"], data.user);
        toast({
          title: "Welcome back!",
          description: `You are now logged in as ${data.user.username}.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      const data = await res.json();
      
      // Check if verification is required
      if (data.verification_required) {
        return { 
          ...data,
          verification_email: credentials.email 
        };
      }
      
      // Store the auth token from the response
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      
      return data; // Return the complete response
    },
    onSuccess: (data) => {
      // If verification is required, don't set the user or show a welcome message
      if (data.verification_required) {
        toast({
          title: "Verification required",
          description: "Please check your email for a verification code to complete your registration.",
        });
        return;
      }
      
      if (data.user) {
        queryClient.setQueryData(["/api/user"], data.user);
        toast({
          title: "Account created!",
          description: `Welcome, ${data.user.username}! Your account has been created successfully.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
      } finally {
        // Remove the auth token even if the API call fails
        removeAuthToken();
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      // Still mark as logged out on the frontend even if the server logout fails
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
  });
  
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: VerifyOtpData) => {
      const res = await apiRequest("POST", "/api/verify-otp", data);
      const result = await res.json();
      
      // Store the auth token from the response
      if (result.access_token) {
        setAuthToken(result.access_token);
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (data.user) {
        queryClient.setQueryData(["/api/user"], data.user);
        toast({
          title: "Verification successful!",
          description: "Your account has been verified successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        verifyOtpMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}