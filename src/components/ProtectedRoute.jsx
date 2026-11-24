
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({
  children,
  allowedRoles = []
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait until the authentication session is restored.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />

          <p className="mt-4 text-sm font-medium text-gray-600">
            Checking your account...
          </p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Check whether the authenticated user has permission.
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user?.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
