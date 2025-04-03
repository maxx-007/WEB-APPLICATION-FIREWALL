import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

function ProtectedRoute({ requireAdmin = false }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    async function verifyAuth() {
      try {
        const token = localStorage.getItem('authToken');
        console.log("Checking auth with token:", token?.substring(0, 15) + "...");
        
        if (!token) {
          console.log("No token found, not authenticated");
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Verify token with backend
        const response = await fetch('http://localhost:5000/verify-token', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("Verification response status:", response.status);
        
        if (!response.ok) {
          console.log("Token verification failed");
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log("Token verification successful:", data);
        
        setIsAuthenticated(true);
        setIsAdmin(data.user.role === 'admin');
        console.log(`User authenticated, admin: ${data.user.role === 'admin'}`);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }
    
    verifyAuth();
  }, []);
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying security credentials...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    // Redirect to dashboard if not admin
    console.log("Admin access required but user is not admin");
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  // Render child routes if authenticated
  console.log("Authentication checks passed, rendering protected content");
  return <Outlet />;
}

export default ProtectedRoute;