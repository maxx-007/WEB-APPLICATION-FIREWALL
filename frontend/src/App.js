import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import FirewallRules from "./pages/FirewallRules";
import AttackLogs from "./pages/AttackLogs";
import LiveTraffic from "./pages/LiveTraffic";
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './pages/ProtectedRoute';
import Login from "./pages/Login";
import { verifyToken, setAuthToken } from "./services/api"; // Import from the correct locationimport "./index.css";  // Ensure Tailwind is loaded first
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
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
                <Navigate to="/dashboard" replace /> :
                <Login setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} />
              }
            />
           
            {/* Protected routes */}
            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/firewall-rules" element={<FirewallRules />} />
              <Route path="/logs" element={<AttackLogs />} />
              <Route path="/live-traffic" element={<LiveTraffic />} />
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
              <Route path="/users" element={<UserManagement />} />
            </Route>
           
            {/* Default redirect - this should be LAST */}
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
            />
           
            {/* Catch all other routes */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;