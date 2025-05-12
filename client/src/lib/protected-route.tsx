import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useProfileDialog } from "@/contexts/profile-dialog-context";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { openProfile } = useProfileDialog();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // If user is not authenticated and not loading, open the auth modal
    if (!isLoading && !user) {
      openAuthModal('login');
    }
    
    // If the path is /profile, open the profile dialog and redirect to home
    if (!isLoading && user && path === '/profile') {
      openProfile();
      navigate('/');
    }
  }, [user, isLoading, openAuthModal, path, openProfile, navigate]);

  // For profile path, just redirect and don't render anything
  if (path === '/profile') {
    return <Route path={path}><div /></Route>;
  }

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