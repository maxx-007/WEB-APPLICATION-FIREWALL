import React, { useEffect, useState } from "react";
import { fetchAttackLogs, fetchFirewallRules } from "../services/api";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [rules, setRules] = useState([]);

  useEffect(() => {
    // Fetch attack logs
    fetchAttackLogs()
      .then((data) => setLogs(data))
      .catch((err) => console.error("Error fetching logs:", err));

    // Fetch firewall rules
    fetchFirewallRules()
      .then((data) => setRules(data))
      .catch((err) => console.error("Error fetching firewall rules:", err));
  }, []);

  return (
    <div className="dashboard">
      <h2>🔥 Web Application Firewall Dashboard</h2>

      <section>
        <h3>🚨 Attack Logs</h3>
        <ul>
          {logs.map((log, index) => (
            <li key={index}>{log.ip} - {log.rule_name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>🛡️ Firewall Rules</h3>
        <ul>
          {rules.map((rule, index) => (
            <li key={index}>{rule.rule_name} - {rule.rule_pattern}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
