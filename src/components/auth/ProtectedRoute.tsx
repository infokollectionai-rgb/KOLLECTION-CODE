import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOnboarded?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, requireOnboarded = true }: Props) {
  const { loading, isAuthenticated, isAdmin, isOnboarded } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (requireOnboarded && !isOnboarded) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}
