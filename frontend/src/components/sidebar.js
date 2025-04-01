import { Link } from "react-router-dom";
import "../styles.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>WAF Dashboard</h2>
      <nav>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/firewall-rules">Firewall Rules</Link></li>
          <li><Link to="/logs">Attack Logs</Link></li>
          <li><Link to="/live-traffic">Live Traffic</Link></li>
        </ul>
      </nav>
    </div>
  );
}
export default Sidebar;