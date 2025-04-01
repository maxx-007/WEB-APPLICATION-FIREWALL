import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import FirewallRules from "./pages/FirewallRules";
import AttackLogs from "./pages/AttackLogs";
import LiveTraffic from "./pages/LiveTraffic";
import Login from "./pages/Login";
import "./styles.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Sidebar />}
        <div className="content">
          <Routes>
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/firewall-rules" element={isAuthenticated ? <FirewallRules /> : <Navigate to="/login" />} />
            <Route path="/logs" element={isAuthenticated ? <AttackLogs /> : <Navigate to="/login" />} />
            <Route path="/live-traffic" element={isAuthenticated ? <LiveTraffic /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; // Ensure this line exists