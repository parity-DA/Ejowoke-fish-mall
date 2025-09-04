import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, UserRole } from '@/hooks/useUserRoles';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: rolesLoading, hasRole } = useUserRoles();
  const location = useLocation();

  const isLoading = authLoading || rolesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If allowedRoles are specified, check if the user has one of them.
  // The hasRole function in the hook checks for hierarchy (e.g., super_admin has all roles).
  // For this specific route, we want an exact match.
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User does not have the required role, redirect them.
      // Redirect to home page or a dedicated 'unauthorized' page.
      return <Navigate to="/" replace />;
    }
  }

  // If no roles are specified, or if the user has the required role, render the children.
  return <>{children}</>;
};

export default ProtectedRoute;
