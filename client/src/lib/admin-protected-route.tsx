import { useAdmin } from "@/contexts/admin-context";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface AdminProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  requireRoles?: string[];
}

export function AdminProtectedRoute({
  path,
  component: Component,
  requireRoles = ["admin", "super_admin"],
}: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, admin } = useAdmin();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Route path={path}>
        <Redirect to="/admin/login" />
      </Route>
    );
  }

  // Check role-based access if roles are specified
  if (requireRoles.length > 0 && admin && !requireRoles.includes(admin.role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">
            You don't have the required permissions to access this page.
          </p>
        </div>
      </Route>
    );
  }

  // Render the protected component
  return <Route path={path} component={Component} />;
}