import { Link, useLocation } from "react-router-dom";
import { Shield, MonitorX, Terminal, Activity, Database, Settings, Users, AlertTriangle, Server, LogOut } from "lucide-react";
import "../styles.css";

function Sidebar({ onLogout }) {
  const location = useLocation();
  
  // Function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar cyberpunk-sidebar">
      <div className="logo-container">
        <div className="logo-shield">
          <Shield size={24} />
        </div>
        <h2>WAF<span className="highlight">DEFENDER</span></h2>
      </div>

      <div className="status-indicator">
        <div className="status-dot active"></div>
        <span>PROTECTION ACTIVE</span>
      </div>
      
      <nav>
        <ul>
          <li className={isActive("/dashboard") ? "active" : ""}>
            <Link to="/dashboard">
              <Activity size={18} />
              <span>Security Overview</span>
            </Link>
          </li>
          
          <li className={isActive("/firewall-rules") ? "active" : ""}>
            <Link to="/firewall-rules">
              <Shield size={18} />
              <span>Firewall Rules</span>
            </Link>
          </li>
          
          <li className={isActive("/logs") ? "active" : ""}>
            <Link to="/logs">
              <Terminal size={18} />
              <span>Attack Logs</span>
            </Link>
          </li>
          
          <li className={isActive("/live-traffic") ? "active" : ""}>
            <Link to="/live-traffic">
              <Activity size={18} />
              <span>Live Traffic</span>
            </Link>
          </li>
          
          <li className={isActive("/threat-analytics") ? "active" : ""}>
            <Link to="/threat-analytics">
              <AlertTriangle size={18} />
              <span>Threat Analytics</span>
            </Link>
          </li>
          
          <li className={isActive("/api-security") ? "active" : ""}>
            <Link to="/api-security">
              <Server size={18} />
              <span>API Security</span>
            </Link>
          </li>
          
          <li className={isActive("/ip-management") ? "active" : ""}>
            <Link to="/ip-management">
              <Database size={18} />
              <span>IP Management</span>
            </Link>
          </li>
          
          <li className={isActive("/user-management") ? "active" : ""}>
            <Link to="/user-management">
              <Users size={18} />
              <span>User Management</span>
            </Link>
          </li>
          
          <li className={isActive("/settings") ? "active" : ""}>
            <Link to="/settings">
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="protection-stats">
          <div className="stat">
            <span className="stat-value">1,293</span>
            <span className="stat-label">Threats Blocked Today</span>
          </div>
        </div>
        
        <button onClick={onLogout} className="logout-button">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;