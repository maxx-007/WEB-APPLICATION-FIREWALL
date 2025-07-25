import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import FirewallRules from "./pages/FirewallRules";
import AttackLogs from "./pages/AttackLogs";
import LiveTraffic from "./pages/LiveTraffic";
import UserManagement from './pages/UserManagement';
import ThreatAnalytics from './pages/ThreatAnalytics';
import APISecurityPage from './pages/APISecurityPage';
import IPManagement from './pages/IPManagement';
import Settings from './pages/Settings';
import ProtectedRoute from './pages/ProtectedRoute';
import Login from "./pages/Login";
import { verifyToken, setAuthToken, logout } from "./services/api"; // Import from the correct locationimport "./index.css";  // Ensure Tailwind is loaded first
import "./App.css";  // Your custom styles

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
 
  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
          // Set the token in axios defaults
          setAuthToken(token);
          
          // Verify with server if token is still valid
          const result = await verifyToken();
          if (result.valid) {
            setIsAuthenticated(true);
            setUser(result.user);
          } else {
            // Token is invalid or expired
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      // First call the logout API to invalidate the session on the server
      await logout();
      
      // Then clear local state
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthenticated(false);
      setUser(null);
      
      // Use window.location for navigation instead of React Router
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if API call fails, continue with local logout
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = "/login";
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Sidebar user={user} onLogout={handleLogout} />}
        <div className="content">
          <Routes>
            {/* Login route */}
            <Route
              path="/login"
              element={
                isAuthenticated ?
                <Navigate to="/dashboard" replace={true} state={{from: '/login'}} /> :
                <Login setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} />
              }
            />
           
            {/* Protected routes */}
            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} userRole={user?.role} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/firewall-rules" element={<FirewallRules />} />
              <Route path="/logs" element={<AttackLogs />} />
              <Route path="/live-traffic" element={<LiveTraffic />} />
              <Route path="/threat-analytics" element={<ThreatAnalytics />} />
              <Route path="/api-security" element={<APISecurityPage />} />
              <Route path="/ip-management" element={<IPManagement />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
           
            {/* Admin-only routes */}
            <Route
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  requireAdmin={true}
                  userRole={user?.role}
                />
              }
            >
              <Route path="/user-management" element={<UserManagement />} />
            </Route>
           
            {/* Default redirect - this should be LAST */}
            <Route
              path="/"
              element={
                <Navigate 
                  to={isAuthenticated ? "/dashboard" : "/login"} 
                  replace={true} 
                  state={{from: '/'}}
                />
              }
            />
           
            {/* Catch all other routes */}
            <Route 
              path="*" 
              element={
                <Navigate 
                  to={isAuthenticated ? "/dashboard" : "/login"} 
                  replace={true}
                  state={{from: window.location.pathname}}
                />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;