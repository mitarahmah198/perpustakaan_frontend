import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading, isSuperAdmin, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0a5c36] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const roleLower = user?.role ? user.role.toLowerCase() : '';
    const hasRole = allowedRoles.some(role => {
      const target = role.toLowerCase();
      if (target === 'superadmin') return isSuperAdmin;
      if (target === 'staf') return isStaff;
      return roleLower.includes(target);
    });

    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}
