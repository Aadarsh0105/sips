


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../../lib/types';
import { useAppSelector } from '../../hooks/useAppSelector';

export function ProtectedRoute({
  role,
  children



}: {role?: Role;children: React.ReactNode;}) {
  const { user, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const currentRole = user?.role?.toLowerCase() as Role | undefined;
  const requiredRole = role?.toLowerCase() as Role | undefined;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>);

  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && currentRole !== requiredRole) {
    return <Navigate to={currentRole === 'ADMIN' ? '/admin' : '/reception'} replace />;
  }

  return <>{children}</>;
}
