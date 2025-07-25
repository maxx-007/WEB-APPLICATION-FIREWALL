import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

function ProtectedRoute({ isAuthenticated, requireAdmin = false, userRole }) {
  const location = useLocation();
  
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated, "userRole:", userRole);
  
  if (isAuthenticated === null) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying security credentials...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace={true} />;
  }
  
  if (requireAdmin && userRole !== 'admin') {
    console.log("Admin access required but user is not admin");
    return <Navigate to="/dashboard" state={{ from: location }} replace={true} />;
  }
  
  // Render child routes if authenticated
  console.log("Authentication checks passed, rendering protected content");
  return <Outlet />;
}

export default ProtectedRoute;