import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/App";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  
  useEffect(() => {
    // If user is not authenticated and not loading, open the auth modal
    if (!isLoading && !user) {
      openAuthModal('login');
    }
  }, [user, isLoading, openAuthModal]);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Component />
      )}
    </Route>
  );
}