import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from './LoginScreen';

/** Blocks the whole app until someone signs in. */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading, isAuthAvailable } = useAuth();

  // Local mode (no Supabase project): there is no backend to protect, so don't lock the user out.
  if (!isAuthAvailable) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/70">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return session ? <>{children}</> : <LoginScreen />;
};
